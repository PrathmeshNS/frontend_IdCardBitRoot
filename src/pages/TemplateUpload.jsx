import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { templatesAPI } from '../utils/api'
import TemplateUploadComponent from '../components/TemplateUpload'
import { ArrowLeft, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const TemplateUpload = () => {
  const navigate = useNavigate()
  const [uploading, setUploading] = useState(false)
  const [showAIForm, setShowAIForm] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState([])
  const [loadingAI, setLoadingAI] = useState(false)

  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm()

  const aiForm = useForm()

  const handleTemplateUpload = async (file) => {
    const name = watch('name')
    const description = watch('description')

    if (!name) {
      toast.error('Please enter a template name first')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('name', name)
      if (description) {
        formData.append('description', description)
      }

      const response = await templatesAPI.upload(formData)
      toast.success('Template uploaded successfully!')
      
      // Navigate to designer page
      navigate(`/designer/${response.data.id}`)
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to upload template'
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  const handleGetAISuggestions = async (data) => {
    setLoadingAI(true)
    try {
      const response = await templatesAPI.getAISuggestions(data)
      setAISuggestions(response.data.suggestions)
      setShowAIForm(false)
      toast.success('AI suggestions generated!')
    } catch (error) {
      toast.error('Failed to get AI suggestions')
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900">Upload Template</h1>
        <p className="text-gray-600 mt-2">
          Upload your ID card template and get AI-powered design suggestions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Template Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(() => {})} className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Template Details</h2>
                <p className="card-description">
                  Provide information about your ID card template
                </p>
              </div>
              
              <div className="card-content space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Template Name *
                  </label>
                  <input
                    {...register('name', { 
                      required: 'Template name is required',
                      minLength: {
                        value: 2,
                        message: 'Name must be at least 2 characters'
                      }
                    })}
                    type="text"
                    className="mt-1 input"
                    placeholder="e.g., Student ID Card 2024"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 input"
                    placeholder="Describe the purpose and design of this template..."
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Upload Template Image</h2>
                <p className="card-description">
                  Upload a PNG, JPG, or JPEG file of your ID card template
                </p>
              </div>
              
              <div className="card-content">
                <TemplateUploadComponent 
                  onUpload={handleTemplateUpload}
                  loading={uploading}
                />
              </div>
            </div>
          </form>
        </div>

        {/* AI Suggestions Sidebar */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <span>AI Design Assistant</span>
              </h2>
              <p className="card-description">
                Get AI-powered design suggestions for your ID card
              </p>
            </div>
            
            <div className="card-content">
              {!showAIForm ? (
                <button
                  onClick={() => setShowAIForm(true)}
                  className="w-full btn-outline"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get AI Suggestions
                </button>
              ) : (
                <form onSubmit={aiForm.handleSubmit(handleGetAISuggestions)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Organization Type
                    </label>
                    <select
                      {...aiForm.register('organization_type', { required: true })}
                      className="mt-1 input"
                    >
                      <option value="">Select type</option>
                      <option value="college">College/University</option>
                      <option value="school">School</option>
                      <option value="company">Company</option>
                      <option value="hospital">Hospital</option>
                      <option value="government">Government</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Card Purpose
                    </label>
                    <select
                      {...aiForm.register('card_purpose', { required: true })}
                      className="mt-1 input"
                    >
                      <option value="">Select purpose</option>
                      <option value="student_id">Student ID</option>
                      <option value="employee_id">Employee ID</option>
                      <option value="visitor_pass">Visitor Pass</option>
                      <option value="access_card">Access Card</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Template Description
                    </label>
                    <textarea
                      {...aiForm.register('template_description', { required: true })}
                      rows={3}
                      className="mt-1 input"
                      placeholder="Describe your template design requirements..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAIForm(false)}
                      className="flex-1 btn-outline"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loadingAI}
                      className="flex-1 btn-primary"
                    >
                      {loadingAI ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        'Generate'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* AI Suggestions Display */}
          {aiSuggestions.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">AI Suggestions</h3>
              </div>
              
              <div className="card-content space-y-4">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-sm text-yellow-800 mb-1">
                      {suggestion.category}
                    </h4>
                    <p className="text-sm text-yellow-700 mb-2">
                      {suggestion.suggestion}
                    </p>
                    {suggestion.reasoning && (
                      <p className="text-xs text-yellow-600">
                        {suggestion.reasoning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateUpload