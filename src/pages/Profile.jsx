import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Mail, GraduationCap, Eye, Heart, FolderKanban, Bookmark, ShieldCheck } from 'lucide-react'
import apiClient from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { textareaClass, fileInputClass, getErrorMessage } from '@/lib/helpers'
import Avatar from '@/components/Avatar'
import GithubIcon from '@/components/GithubIcon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_AVATAR_MB = 2

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const [bio, setBio] = useState(user?.bio || '')
  const [batch, setBatch] = useState(user?.batch || '')
  const [githubUsername, setGithubUsername] = useState(user?.github_username || '')
  const [avatar, setAvatar] = useState(null)
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['my-stats'],
    queryFn: async () => (await apiClient.get('/users/me/stats/')).data,
  })

  const handleAvatar = (e) => {
    const file = e.target.files?.[0] || null
    if (file && !/\.(jpe?g|png)$/i.test(file.name)) {
      toast.error('Avatar must be a JPG or PNG image.')
      e.target.value = ''
      setPreview(null)
      return setAvatar(null)
    }
    if (file && file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Avatar cannot exceed ${MAX_AVATAR_MB} MB.`)
      e.target.value = ''
      setPreview(null)
      return setAvatar(null)
    }
    setAvatar(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('batch', batch)
      formData.append('github_username', githubUsername)
      if (avatar) formData.append('avatar', avatar)

      await apiClient.patch('/users/me/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      await refreshUser()
      setAvatar(null)
      setPreview(null)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  const facts = [
    { icon: FolderKanban, label: 'Projects', value: stats?.projects },
    { icon: Eye, label: 'Views', value: stats?.total_views },
    { icon: Heart, label: 'Likes', value: stats?.total_likes },
    { icon: Bookmark, label: 'Saved by others', value: stats?.bookmarks_received },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
      {/* Header card */}
      <section className="overflow-hidden rounded-3xl border bg-card">
        <div className="h-28 bg-brand-gradient animated-gradient" />
        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end gap-4">
            <Avatar src={preview || user?.avatar} name={user?.username} size="xl" className="ring-4 ring-card" />
            <div className="pb-1">
              <h1 className="text-2xl font-bold leading-tight">{user?.username}</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium capitalize text-primary">
                <ShieldCheck className="size-3" /> {user?.role}
              </span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><Mail className="size-4" /> {user?.email || 'No email added'}</span>
            {user?.batch && <span className="inline-flex items-center gap-1.5"><GraduationCap className="size-4" /> {user.batch}</span>}
            {user?.github_username && <span className="inline-flex items-center gap-1.5"><GithubIcon className="size-4" /> {user.github_username}</span>}
          </div>
          {user?.bio && <p className="mt-3 text-sm">{user.bio}</p>}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="lift rounded-2xl border bg-card p-4 text-center">
            <Icon className="mx-auto size-5 text-primary" />
            <p className="mt-2 text-xl font-bold">{value ?? '–'}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Edit form */}
      <form onSubmit={handleSave} className="space-y-4 rounded-3xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Edit profile</h2>

        <div>
          <label className="mb-1 block text-sm font-medium">Bio</label>
          <textarea
            className={textareaClass}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a little about yourself"
          />
          <p className="text-right text-xs text-muted-foreground">{bio.length}/500</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Batch</label>
            <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. Batch 5 / Django 2026" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">GitHub username</label>
            <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="your-github-username" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Profile picture (JPG/PNG, max {MAX_AVATAR_MB} MB)</label>
          <input type="file" accept="image/png,image/jpeg" className={fileInputClass} onChange={handleAvatar} />
          {avatar && <p className="text-xs text-muted-foreground">Selected: {avatar.name}</p>}
        </div>

        <Button type="submit" disabled={saving} className="bg-brand-gradient animated-gradient border-0 text-white">
          {saving ? 'Saving...' : 'Save profile'}
        </Button>
      </form>
    </div>
  )
}
