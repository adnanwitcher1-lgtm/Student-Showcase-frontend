import { useState } from 'react'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { textareaClass, fileInputClass, getErrorMessage } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const MAX_AVATAR_MB = 2

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const [bio, setBio] = useState(user?.bio || '')
  const [batch, setBatch] = useState(user?.batch || '')
  const [githubUsername, setGithubUsername] = useState(user?.github_username || '')
  const [avatar, setAvatar] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAvatar = (e) => {
    const file = e.target.files?.[0] || null
    if (file && !/\.(jpe?g|png)$/i.test(file.name)) {
      toast.error('Avatar must be a JPG or PNG image.')
      e.target.value = ''
      return setAvatar(null)
    }
    if (file && file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Avatar cannot exceed ${MAX_AVATAR_MB} MB.`)
      e.target.value = ''
      return setAvatar(null)
    }
    setAvatar(file)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // Backend sirf multipart leta hai (avatar upload ki wajah se)
      const formData = new FormData()
      formData.append('bio', bio)
      formData.append('batch', batch)
      formData.append('github_username', githubUsername)
      if (avatar) formData.append('avatar', avatar)

      await apiClient.patch('/users/me/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await refreshUser()
      setAvatar(null)
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="flex items-center gap-4 mb-6">
        {user?.avatar ? (
          <img src={user.avatar} alt="Avatar" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="size-16 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-xl font-semibold">
            {user?.username?.[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold">{user?.username}</p>
          <p className="text-sm text-gray-500">{user?.email || 'No email'} · {user?.role}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className={textareaClass}
            maxLength={500}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell others a little about yourself"
          />
          <p className="text-xs text-gray-400 text-right">{bio.length}/500</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Batch</label>
          <Input value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="e.g. Batch 5 / Django 2026" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">GitHub username</label>
          <Input value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} placeholder="your-github-username" />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Avatar (JPG/PNG, max {MAX_AVATAR_MB} MB)</label>
          <input type="file" accept="image/png,image/jpeg" className={fileInputClass} onChange={handleAvatar} />
          {avatar && <p className="text-xs text-gray-500">Selected: {avatar.name}</p>}
        </div>

        <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
      </form>
    </div>
  )
}
