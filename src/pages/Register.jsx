import { useState } from 'react'
import apiClient from '@/lib/api'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.password2) {
      alert('Passwords do not match')
      return
    }

    try {
      const response = await apiClient.post(
        '/auth/register/',
        {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          password2: formData.password2,
        }
      )

      console.log(response.data)
      alert('Registration Successful')

      setFormData({
        username: '',
        email: '',
        password: '',
        password2: '',
      })
    } catch (error) {
      console.error(error)

      if (error.response) {
        alert(JSON.stringify(error.response.data))
      } else {
        alert('Registration Failed')
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded">
      <h1 className="text-2xl font-bold mb-4">
        Register
      </h1>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData({
              ...formData,
              username: e.target.value,
            })
          }
          className="w-full border p-2 mb-3"
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({
              ...formData,
              email: e.target.value,
            })
          }
          className="w-full border p-2 mb-3"
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData({
              ...formData,
              password: e.target.value,
            })
          }
          className="w-full border p-2 mb-3"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.password2}
          onChange={(e) =>
            setFormData({
              ...formData,
              password2: e.target.value,
            })
          }
          className="w-full border p-2 mb-3"
        />

        <button
          type="submit"
          className="bg-black text-white px-4 py-2 rounded"
        >
          Register
        </button>
      </form>
    </div>
  )
}