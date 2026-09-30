import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/api'
import { uploadSchema } from '@/lib/uploadSchema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'

const STEPS = ['Basic Info', 'Media', 'Links', 'Review']

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
      } else {
        const res = await apiClient.patch(`/projects/${projectSlug}/`, payload)
        return res.data
      }
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
    onSuccess: () => navigate(`/projects/${projectSlug}`),
  })

  const stepFields = {
    0: ['title', 'description', 'category'],
    1: [],
    2: ['github_url', 'live_demo_url'],
    3: [],
  }

  const handleNext = async () => {
    const fieldsToValidate = stepFields[step]
    const isValid = fieldsToValidate.length === 0 || (await trigger(fieldsToValidate))
    if (!isValid) return

    if (step === 0) {
      await saveDraft.mutateAsync({
        title: values.title,
        description: values.description,
        status: 'draft',
      })
    } else if (step === 1 && values.screenshots?.length) {
      await uploadScreenshots.mutateAsync(values.screenshots)
    } else if (step === 2) {
      await saveDraft.mutateAsync({
        github_url: values.github_url || '',
        live_demo_url: values.live_demo_url || '',
      })
    }

    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => setStep((s) => Math.max(s - 1, 0))

  const handleFinalSubmit = () => submitProject.mutate()

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
        <div className="space-y-4">
          <label className="block text-sm font-medium">Screenshots</label>
          <input type="file" multiple accept="image/*" {...register('screenshots')} />
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
          <p><strong>GitHub:</strong> {values.github_url || '—'}</p>
          <p><strong>Live demo:</strong> {values.live_demo_url || '—'}</p>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={handleBack} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={saveDraft.isPending || uploadScreenshots.isPending}>
            Next
          </Button>
        ) : (
          <Button onClick={handleFinalSubmit} disabled={submitProject.isPending}>
            Submit for Review
          </Button>
        )}
      </div>
    </div>
  )
}