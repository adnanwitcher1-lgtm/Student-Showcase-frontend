import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { uploadSchema } from '@/lib/uploadSchema'
import { selectClass, textareaClass, fileInputClass, getErrorMessage } from '@/lib/helpers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Clapperboard } from 'lucide-react'

const STEPS = ['Basic Info', 'Media', 'Links', 'Review']
const MAX_ZIP_MB = 20
const MAX_VIDEO_MB = 100

// Ek hi wizard: /upload (naya project) aur /edit/:slug (draft/rejected project edit + resubmit)
export default function UploadWizard() {
  const { slug: editSlug } = useParams()
  const isEdit = Boolean(editSlug)

  const [step, setStep] = useState(0)
  const [projectSlug, setProjectSlug] = useState(editSlug || null)
  const [techOverride, setTechOverride] = useState(null) // null = abhi user ne chhua nahi
  const [zipFile, setZipFile] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [videoProgress, setVideoProgress] = useState(0)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: options } = useQuery({
    queryKey: ['filter-options'],
    queryFn: async () => (await apiClient.get('/filter-options/')).data,
    staleTime: 5 * 60 * 1000,
  })

  const { data: existing, isLoading: loadingExisting, isError: existingError } = useQuery({
    queryKey: ['project-edit', editSlug],
    queryFn: async () => (await apiClient.get(`/projects/${editSlug}/`)).data,
    enabled: isEdit,
    refetchOnWindowFocus: false,
  })

  // Edit mode mein form ko purani values se bharo
  const formValues = useMemo(
    () =>
      existing
        ? {
            title: existing.title || '',
            description: existing.description || '',
            category: existing.category?.id ? String(existing.category.id) : '',
            github_url: existing.github_url || '',
            live_demo_url: existing.live_demo_url || '',
          }
        : undefined,
    [existing]
  )

  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(uploadSchema),
    mode: 'onBlur',
    values: formValues,
  })

  const values = watch()
  const techIds = techOverride ?? existing?.tech_stack?.map((t) => t.id) ?? []
  const projectStatus = existing?.status || 'draft'

  const toggleTech = (id) =>
    setTechOverride(techIds.includes(id) ? techIds.filter((x) => x !== id) : [...techIds, id])

  const saveDraft = useMutation({
    mutationFn: async (payload) => {
      if (!projectSlug) {
        const res = await apiClient.post('/projects/', payload)
        setProjectSlug(res.data.slug)
        return res.data
      }
      const res = await apiClient.patch(`/projects/${projectSlug}/`, payload)
      return res.data
    },
  })

  const uploadCover = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('cover_image', file)
      const res = await apiClient.patch(`/projects/${projectSlug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })

  const uploadScreenshots = useMutation({
    mutationFn: async (files) => {
      const formData = new FormData()
      Array.from(files).forEach((file) => formData.append('images', file))
      const res = await apiClient.post(`/projects/${projectSlug}/screenshots/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })

  const uploadSite = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('site_zip', file)
      const res = await apiClient.post(`/projects/${projectSlug}/static-site/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return res.data
    },
  })

  const uploadVideo = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData()
      formData.append('demo_video', file)
      setVideoProgress(0)
      const res = await apiClient.patch(`/projects/${projectSlug}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 0,
        onUploadProgress: (e) => e.total && setVideoProgress(Math.round((e.loaded / e.total) * 100)),
      })
      return res.data
    },
  })

  const finish = useMutation({
    mutationFn: async () => {
      // Draft ya rejected hi submit ho sakta hai. Approved/submitted project mein sirf changes save hoti hain.
      if (['draft', 'rejected'].includes(projectStatus)) {
        return (await apiClient.post(`/projects/${projectSlug}/submit/`)).data
      }
      return null
    },
    onSuccess: (data) => {
      toast.success(data ? 'Project submitted for review!' : 'Changes saved.')
      queryClient.invalidateQueries({ queryKey: ['project', projectSlug] })
      queryClient.invalidateQueries({ queryKey: ['my-projects'] })
      navigate(`/projects/${projectSlug}`)
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not submit the project. Please try again.')),
  })

  const stepFields = {
    0: ['title', 'description', 'category'],
    1: [],
    2: ['github_url', 'live_demo_url'],
    3: [],
  }

  const isBusy =
    saveDraft.isPending || uploadCover.isPending || uploadScreenshots.isPending || uploadSite.isPending || uploadVideo.isPending

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step]
    const isValid = fieldsToValidate.length === 0 || (await trigger(fieldsToValidate))
    if (!isValid) return

    try {
      if (step === 0) {
        await saveDraft.mutateAsync({
          title: values.title,
          description: values.description,
          category: values.category ? Number(values.category) : null,
          tech_stack: techIds,
        })
        toast.success('Draft saved.')
      } else if (step === 1) {
        const cover = values.cover_image?.[0]
        const shots = values.screenshots

        if (cover) {
          await uploadCover.mutateAsync(cover)
          toast.success('Cover image uploaded.')
        }
        if (shots?.length) {
          await uploadScreenshots.mutateAsync(shots)
          toast.success('Screenshots uploaded.')
        }
      } else if (step === 2) {
        await saveDraft.mutateAsync({
          github_url: values.github_url || '',
          live_demo_url: values.live_demo_url || '',
        })
        if (videoFile) {
          await uploadVideo.mutateAsync(videoFile)
          setVideoFile(null)
          toast.success('Demo video uploaded.')
        }
        if (zipFile) {
          await uploadSite.mutateAsync(zipFile)
          toast.success('Static site is being deployed. It will be live in about a minute.')
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong. Please try again.'))
      return // error par agle step par mat jao
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleVideo = (e) => {
    const file = e.target.files?.[0] || null
    if (file && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      toast.error('Video must be an MP4, WebM or MOV file.')
      e.target.value = ''
      return setVideoFile(null)
    }
    if (file && file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video cannot exceed ${MAX_VIDEO_MB} MB.`)
      e.target.value = ''
      return setVideoFile(null)
    }
    setVideoFile(file)
  }

  const handleZip = (e) => {
    const file = e.target.files?.[0] || null
    if (file && !file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Please choose a .zip file.')
      e.target.value = ''
      return setZipFile(null)
    }
    if (file && file.size > MAX_ZIP_MB * 1024 * 1024) {
      toast.error(`Zip file cannot exceed ${MAX_ZIP_MB} MB.`)
      e.target.value = ''
      return setZipFile(null)
    }
    setZipFile(file)
  }

  if (isEdit && loadingExisting) return <p className="p-8">Loading project...</p>
  if (isEdit && existingError) return <p className="p-8 text-red-500">Project not found.</p>

  const coverName = values.cover_image?.[0]?.name
  const shotNames = values.screenshots ? Array.from(values.screenshots).map((f) => f.name) : []
  const categoryName = options?.categories?.find((c) => String(c.id) === String(values.category))?.name
  const techNames = options?.tech_stack?.filter((t) => techIds.includes(t.id)).map((t) => t.name) || []
  const willSubmit = ['draft', 'rejected'].includes(projectStatus)

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-8">
     <div className="rounded-3xl border bg-card p-5 sm:p-8 shadow-xl shadow-primary/5">
      <h1 className="text-2xl font-bold mb-2 text-brand-gradient w-fit">{isEdit ? 'Edit Project' : 'Upload Project'}</h1>
      <Progress value={((step + 1) / STEPS.length) * 100} className="mb-6" />
      <p className="text-sm text-gray-500 mb-6">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {isEdit && existing?.status === 'rejected' && existing.rejection_reason && (
        <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
          <strong>Rejected:</strong> {existing.rejection_reason}
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input placeholder="Project title" {...register('title')} />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Markdown supported)</label>
            <textarea
              className={textareaClass}
              placeholder="What does your project do? Which problem does it solve?"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select className={selectClass} {...register('category')}>
              <option value="">Select a category</option>
              {options?.categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tech stack</label>
            <div className="flex flex-wrap gap-2">
              {options?.tech_stack?.map((t) => {
                const on = techIds.includes(t.id)
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleTech(t.id)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${
                      on
                        ? 'bg-brand-gradient text-white border-transparent shadow shadow-primary/30'
                        : 'border-border hover:border-primary/60 hover:bg-primary/10'
                    }`}
                  >
                    {t.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Cover image (shown on the project card)</label>
            {isEdit && existing?.cover_image && !coverName && (
              <img src={existing.cover_image} alt="Current cover" className="h-24 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={fileInputClass}
              {...register('cover_image')}
            />
            {coverName && <p className="text-xs text-gray-500">Selected: {coverName}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Screenshots (optional, max 5 MB each)</label>
            {isEdit && existing?.screenshots?.length > 0 && (
              <p className="text-xs text-gray-500">
                {existing.screenshots.length} screenshot(s) already uploaded. New ones are added to them.
              </p>
            )}
            <input
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp"
              className={fileInputClass}
              {...register('screenshots')}
            />
            {shotNames.length > 0 && (
              <p className="text-xs text-gray-500">
                Selected ({shotNames.length}): {shotNames.join(', ')}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">GitHub repository</label>
            <Input placeholder="https://github.com/username/repo" {...register('github_url')} />
            {errors.github_url && <p className="text-red-500 text-sm mt-1">{errors.github_url.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Live demo link (optional)</label>
            <Input placeholder="https://your-demo-link.com" {...register('live_demo_url')} />
            {errors.live_demo_url && (
              <p className="text-red-500 text-sm mt-1">{errors.live_demo_url.message}</p>
            )}
          </div>

          <div className="space-y-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Clapperboard className="size-4 text-primary" /> Demo video (optional)
            </label>
            <p className="text-xs text-muted-foreground">
              No live link? Upload a short screen recording instead (MP4, WebM or MOV, max {MAX_VIDEO_MB} MB).
              Visitors can watch it on your project page.
            </p>
            {isEdit && existing?.demo_video && !videoFile && (
              <p className="text-xs text-emerald-500">A demo video is already uploaded. Choose a file to replace it.</p>
            )}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className={fileInputClass} onChange={handleVideo} />
            {videoFile && <p className="text-xs text-muted-foreground">Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
            {uploadVideo.isPending && (
              <div className="space-y-1">
                <Progress value={videoProgress} />
                <p className="text-xs text-muted-foreground">Uploading video… {videoProgress}%</p>
              </div>
            )}
          </div>

          <div className="space-y-2 border-t pt-5">
            <label className="block text-sm font-medium">Host a static website (optional)</label>
            <p className="text-xs text-gray-500">
              Upload a .zip of a plain HTML/CSS/JS project (max {MAX_ZIP_MB} MB). It must contain
              <code className="mx-1">index.html</code> at the top level of the zip. We host it for you.
            </p>
            <input type="file" accept=".zip" className={fileInputClass} onChange={handleZip} />
            {zipFile && <p className="text-xs text-gray-500">Selected: {zipFile.name}</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 text-sm border rounded-lg p-4 break-words">
          <p><strong>Title:</strong> {values.title}</p>
          <p><strong>Category:</strong> {categoryName || '—'}</p>
          <p><strong>Tech stack:</strong> {techNames.length ? techNames.join(', ') : '—'}</p>
          <p><strong>Description:</strong> {values.description}</p>
          <p><strong>Cover image:</strong> {coverName || (existing?.cover_image ? 'Current image kept' : '—')}</p>
          <p><strong>New screenshots:</strong> {shotNames.length || '—'}</p>
          <p><strong>GitHub:</strong> {values.github_url || '—'}</p>
          <p><strong>Live demo:</strong> {values.live_demo_url || '—'}</p>
          <p><strong>Demo video:</strong> {videoFile ? videoFile.name : existing?.demo_video ? 'Already uploaded' : '—'}</p>
          <p><strong>Hosted site:</strong> {zipFile ? zipFile.name : '—'}</p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={step === 0 || isBusy}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={isBusy}>
            {isBusy ? 'Saving...' : 'Next'}
          </Button>
        ) : (
          <Button onClick={() => finish.mutate()} disabled={finish.isPending}>
            {finish.isPending ? 'Saving...' : willSubmit ? 'Submit for Review' : 'Save changes'}
          </Button>
        )}
      </div>
     </div>
    </div>
  )
}
