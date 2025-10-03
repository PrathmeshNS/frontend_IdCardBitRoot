import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { DndContext, DragOverlay, useDraggable } from '@dnd-kit/core'
import { templatesAPI, generationAPI } from '../utils/api'
import DragDropCanvas from '../components/DragDropCanvas'
import PreviewCard from '../components/PreviewCard'
import { 
  ArrowLeft, 
  Upload, 
  Download, 
  Settings, 
  Eye,
  Sparkles,
  Save
} from 'lucide-react'
import toast from 'react-hot-toast'
import { generateId } from '../utils/helpers'

// Draggable Field Component
const DraggableField = ({ fieldName, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${fieldName}`,
    data: { fieldName }
  })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 bg-gray-100 border border-gray-300 rounded-md cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors"
    >
      {children}
    </div>
  )
}

const Designer = () => {
  const { templateId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const step = searchParams.get('step')

  const [template, setTemplate] = useState(null)
  const [fieldMappings, setFieldMappings] = useState([])
  const [availableFields, setAvailableFields] = useState([])
  const [sampleData, setSampleData] = useState({})
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [selectedField, setSelectedField] = useState(null)
  const [showFieldSettings, setShowFieldSettings] = useState(false)

  useEffect(() => {
    loadTemplate()
    loadUploadedData()

    // Listen for changes to sessionStorage (uploadedDataFile) so Available Fields
    // update when the user uploads a file on the Data Upload page and navigates back.
    const onStorage = (e) => {
      if (e.key === 'uploadedDataFile') {
        loadUploadedData()
      }
    }

    window.addEventListener('storage', onStorage)
    const onCustom = () => loadUploadedData()
    window.addEventListener('uploadedDataFileUpdated', onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('uploadedDataFileUpdated', onCustom)
    }
  }, [templateId])

  const loadTemplate = async () => {
    try {
      const response = await templatesAPI.getById(templateId)
      setTemplate(response.data)
      setFieldMappings(response.data.field_mappings.map(field => ({
        ...field,
        id: generateId()
      })))
    } catch (error) {
      toast.error('Failed to load template')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadUploadedData = () => {
    try {
      const storedData = sessionStorage.getItem('uploadedDataFile')
      if (!storedData) {
        setAvailableFields([])
        setSampleData({})
        return
      }

      const data = JSON.parse(storedData)

      // Ensure columns is an array of strings
      const cols = Array.isArray(data.preview?.columns) ? data.preview.columns.map(c => String(c)) : []
      setAvailableFields(cols)

      // Use the first sample row if available
      const firstSample = Array.isArray(data.preview?.sample_data) && data.preview.sample_data.length > 0
        ? data.preview.sample_data[0]
        : {}

      setSampleData(firstSample)
    } catch (err) {
      console.warn('Failed to load uploaded data from sessionStorage', err)
      setAvailableFields([])
      setSampleData({})
    }
  }

  const handleFieldAdd = (fieldData) => {
    const newField = {
      ...fieldData,
      id: generateId()
    }
    setFieldMappings([...fieldMappings, newField])
  }

  const handleFieldUpdate = (fieldId, updates) => {
    setFieldMappings(fieldMappings.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
  }

  const handleFieldRemove = (fieldId) => {
    setFieldMappings(fieldMappings.filter(field => field.id !== fieldId))
  }

  const handleSaveTemplate = async () => {
    try {
      await templatesAPI.update(templateId, {
        field_mappings: fieldMappings.map(({ id, ...field }) => field)
      })
      toast.success('Template saved successfully!')
    } catch (error) {
      toast.error('Failed to save template')
    }
  }

  const handleGenerateCards = async () => {
    const storedData = sessionStorage.getItem('uploadedDataFile')
    if (!storedData) {
      toast.error('Please upload data first')
      navigate(`/data/upload/${templateId}`)
      return
    }

    if (fieldMappings.length === 0) {
      toast.error('Please add at least one field mapping')
      return
    }

    setGenerating(true)
    try {
      // Validate field mappings against uploaded columns
      const storedPreview = JSON.parse(storedData).preview
      const columns = storedPreview?.columns || []
      const normalize = (s) => (s || '').toString().toLowerCase().replace(/_|\s+/g, '')
      const colSet = new Set(columns.map(c => normalize(c)))
      const invalidFields = fieldMappings
        .map(f => f.field_name)
        .filter(name => !colSet.has(normalize(name)))

      if (invalidFields.length > 0) {
        toast.error(`The following mapped fields are not found in the uploaded data: ${invalidFields.join(', ')}. Update mappings or upload matching data.`)
        setGenerating(false)
        return
      }

      // Reconstruct the uploaded data file from sessionStorage
      const stored = JSON.parse(storedData)
      let fileToSend
      if (stored && stored.file && stored.file.dataUrl) {
        // Convert data URL back to a Blob
        const res = await fetch(stored.file.dataUrl)
        const blob = await res.blob()
        fileToSend = new File([blob], stored.file.name, { type: stored.file.type || 'text/csv' })
      } else {
        // fallback - should not happen if upload flow worked
        toast.error('Upload data not found')
        setGenerating(false)
        return
      }

      const response = await generationAPI.generate(
        templateId,
        fieldMappings.map(({ id, ...field }) => field),
        fileToSend
      )
      
      toast.success('Card generation started! Check your dashboard for progress.')
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to start generation')
    } finally {
      setGenerating(false)
    }
  }

  const handleGetAIFieldPlacement = async () => {
    if (availableFields.length === 0) {
      toast.error('Please upload data first to get AI suggestions')
      return
    }

    try {
      const response = await templatesAPI.getAIFieldPlacement(templateId, availableFields)
      const suggestions = response.data.field_suggestions

      // Apply AI suggestions
      const aiFieldMappings = suggestions.map(suggestion => ({
        ...suggestion,
        id: generateId()
      }))

      setFieldMappings(aiFieldMappings)
      toast.success('AI field placement suggestions applied!')
    } catch (error) {
      toast.error('Failed to get AI suggestions')
    }
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    setActiveId(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {template?.name}
                  </h1>
                  <p className="text-sm text-gray-500">Design your ID card layout</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Always allow user to upload/replace the data file */}
                <button
                  onClick={() => navigate(`/data/upload/${templateId}`)}
                  className="btn-outline"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload / Replace Data
                </button>

                {availableFields.length > 0 && (
                  <button
                    onClick={handleGetAIFieldPlacement}
                    className="btn-outline"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI Suggestions
                  </button>
                )}

                <button
                  onClick={handleSaveTemplate}
                  className="btn-outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>

                <button
                  onClick={handleGenerateCards}
                  disabled={!availableFields.length || generating}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generating ? (
                    <div className="flex items-center space-x-2">
                      <div className="loading-spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Generating...</span>
                    </div>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Generate Cards
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar - Available Fields */}
            <div className="lg:col-span-1">
              <div className="card sticky top-6">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h2 className="card-title">Available Fields</h2>
                    <p className="card-description">
                      Drag fields onto the template
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => navigate(`/data/upload/${templateId}`)}
                      className="btn-outline text-xs"
                      title="Upload or replace data file"
                    >
                      Change Data
                    </button>
                  </div>
                </div>
                
                <div className="card-content">
                  {availableFields.length === 0 ? (
                    <div className="text-center py-8">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">
                        No data uploaded yet
                      </p>
                      <button
                        onClick={() => navigate(`/data/upload/${templateId}`)}
                        className="btn-primary"
                      >
                        Upload Data
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableFields.map((field) => {
                        const pretty = String(field).replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim()
                        const label = pretty.charAt(0).toUpperCase() + pretty.slice(1)
                        return (
                          <DraggableField key={field} fieldName={field}>
                            <div className="flex items-center space-x-2" title={field}>
                              <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-700 truncate">
                                {label}
                              </span>
                            </div>
                          </DraggableField>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Canvas */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Template Designer</h2>
                  <p className="card-description">
                    Drag and drop fields onto your template
                  </p>
                </div>
                
                <div className="card-content p-0">
                  <DragDropCanvas
                    template={template}
                    fieldMappings={fieldMappings}
                    onFieldUpdate={handleFieldUpdate}
                    onFieldAdd={handleFieldAdd}
                    availableFields={availableFields}
                    className="h-96"
                  />
                </div>
              </div>

              {/* Field Mappings List */}
              {fieldMappings.length > 0 && (
                <div className="card mt-6">
                  <div className="card-header">
                    <h2 className="card-title">Field Mappings</h2>
                    <p className="card-description">
                      Current field mappings on the template
                    </p>
                  </div>
                  
                  <div className="card-content">
                    <div className="space-y-2">
                      {fieldMappings.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-900">
                              {field.field_name}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({Math.round(field.x)}, {Math.round(field.y)})
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedField(field)
                                setShowFieldSettings(true)
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Edit field"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleFieldRemove(field.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Remove field"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Preview */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <PreviewCard
                  template={template}
                  fieldMappings={fieldMappings}
                  sampleData={sampleData}
                />

                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h2 className="card-title">Quick Actions</h2>
                  </div>
                  
                  <div className="card-content space-y-3">
                    <button className="w-full btn-outline text-left">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Sample Card
                    </button>
                    
                    <button
                      onClick={() => setFieldMappings([])}
                      className="w-full btn-outline text-left text-red-600 hover:text-red-700"
                    >
                      Clear All Fields
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <div className="p-2 bg-primary-100 border border-primary-300 rounded-md shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-sm font-medium text-primary-700">
                  {activeId.includes('field-') ? activeId.replace('field-', '') : 
                   fieldMappings.find(f => f.id === activeId)?.field_name || 'Field'}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

export default Designer