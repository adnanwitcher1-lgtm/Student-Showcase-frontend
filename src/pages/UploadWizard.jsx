import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import apiClient from '@/lib/api'
import { uploadSchema } from '@/lib/uploadSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const STEPS = ['Basic Info', 'Media', 'Links', 'Review']

// Backend ke error response se readable message nikalta hai
function getErrorMessage(err, fallback) {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return fallback
  if (data.detail) return data.detail
  if (data.errors?.length) {
    const first = data.errors[0]
    const key = Object.keys(first)[0]
    const msgs = first[key]
    return `${key}: ${JSON.stringify(msgs)}`
  }
  const firstKey = Object.keys(data)[0]
  if (firstKey) {
    const val = data[firstKey]
    return `${firstKey}: ${Array.isArray(val) ? val.join(' ') : String(val)}`
  }
  return fallback
}

const fileInputClass =
  'block w-full text-sm text-gray-600 dark:text-gray-300 ' +
  'file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 ' +
  'file:text-sm file:font-medium file:bg-gray-900 file:text-white ' +
  'hover:file:bg-gray-700 file:cursor-pointer ' +
  'border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3'

export default function UploadWizard() {
  const [step, setStep] = useState(0)
  const [projectSlug, setProjectSlug] = useState(null)
  const navigate = useNavigate()

  const {
    register,
    watch,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(uploadSchema),
    mode: 'onBlur',
  })

  const values = watch()

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

  const submitProject = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/projects/${projectSlug}/submit/`)
      return res.data
    },
    onSuccess: () => {
      toast.success('Project submitted for review!')
      navigate(`/projects/${projectSlug}`)
    },
    onError: (err) => {
      toast.error(getErrorMessage(err, 'Could not submit the project. Please try again.'))
    },
  })

  const stepFields = {
    0: ['title', 'description', 'category'],
    1: [],
    2: ['github_url', 'live_demo_url'],
    3: [],
  }

  const isBusy =
    saveDraft.isPending || uploadCover.isPending || uploadScreenshots.isPending

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step]
    const isValid = fieldsToValidate.length === 0 || (await trigger(fieldsToValidate))
    if (!isValid) return

    try {
      if (step === 0) {
        await saveDraft.mutateAsync({
          title: values.title,
          description: values.description,
          status: 'draft',
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
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong. Please try again.'))
      return // error par agle step par mat jao
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleFinalSubmit = () => submitProject.mutate()

  const coverName = values.cover_image?.[0]?.name
  const shotNames = values.screenshots ? Array.from(values.screenshots).map((f) => f.name) : []

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">Upload Project</h1>
      <Progress value={((step + 1) / STEPS.length) * 100} className="mb-6" />
      <p className="text-sm text-gray-500 mb-6">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Input placeholder="Project title" {...register('title')} />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <Input placeholder="Description" {...register('description')} />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Cover image (card par dikhegi)</label>
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
        <div className="space-y-4">
          <div>
            <Input placeholder="https://github.com/username/repo" {...register('github_url')} />
            {errors.github_url && (
              <p className="text-red-500 text-sm mt-1">{errors.github_url.message}</p>
            )}
          </div>
          <div>
            <Input placeholder="https://your-demo-link.com" {...register('live_demo_url')} />
            {errors.live_demo_url && (
              <p className="text-red-500 text-sm mt-1">{errors.live_demo_url.message}</p>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-2 text-sm border rounded-lg p-4">
          <p><strong>Title:</strong> {values.title}</p>
          <p><strong>Description:</strong> {values.description}</p>
          <p><strong>Cover image:</strong> {coverName || '—'}</p>
          <p><strong>Screenshots:</strong> {shotNames.length || '—'}</p>
          <p><strong>GitHub:</strong> {values.github_url || '—'}</p>
          <p><strong>Live demo:</strong> {values.live_demo_url || '—'}</p>
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
          <Button onClick={handleFinalSubmit} disabled={submitProject.isPending}>
            {submitProject.isPending ? 'Submitting...' : 'Submit for Review'}
          </Button>
        )}
      </div>
    </div>
  )
}