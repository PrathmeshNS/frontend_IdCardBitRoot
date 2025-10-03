import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../utils/AuthContext'
import { templatesAPI, generationAPI } from '../utils/api'
import api from '../utils/api'
import { formatDate, downloadFile } from '../utils/helpers'
import { 
  Plus, 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Trash2, 
  Calendar,
  Users,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const Dashboard = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalGenerated: 0,
    thisMonth: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [templatesRes, historyRes] = await Promise.all([
        templatesAPI.getAll(),
        generationAPI.getHistory()
      ])

      const templatesData = templatesRes.data
      const historyData = historyRes.data

      setTemplates(templatesData)
      setHistory(historyData)

      // Calculate stats
      const totalGenerated = historyData.reduce((sum, item) => sum + item.generated_cards, 0)
      const thisMonth = historyData
        .filter(item => {
          const date = new Date(item.created_at)
          const now = new Date()
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
        })
        .reduce((sum, item) => sum + item.generated_cards, 0)

      setStats({
        totalTemplates: templatesData.length,
        totalGenerated,
        thisMonth
      })
    } catch (error) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await templatesAPI.delete(templateId)
      toast.success('Template deleted successfully')
      loadDashboardData()
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleDownloadPDF = async (generationId, filename) => {
    try {
      // Request the backend download endpoint which proxies/signed the Cloudinary file
      const resp = await api.get(`/generation/download/${generationId}`, {
        responseType: 'blob'
      })

      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast.error('Failed to download PDF')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.organization_name}
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your ID card templates and generation history
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Templates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Cards Generated</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGenerated}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Templates</h2>
          <Link to="/templates/upload" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Upload Template
          </Link>
        </div>

        {templates.length === 0 ? (
          <div className="card text-center py-12">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-600 mb-4">Upload your first template to get started</p>
            <Link to="/templates/upload" className="btn-primary">
              Upload Template
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div key={template.id} className="card">
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={template.template_url}
                    alt={template.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {template.name}
                </h3>
                
                {template.description && (
                  <p className="text-sm text-gray-600 mb-4">
                    {template.description}
                  </p>
                )}
                
                <div className="text-xs text-gray-500 mb-4">
                  Created {formatDate(template.created_at)}
                </div>
                
                <div className="flex space-x-2">
                  <Link
                    to={`/designer/${template.id}`}
                    className="flex-1 btn-primary text-center"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Design
                  </Link>
                  
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generation History */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Generation History</h2>
        
        {history.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No generation history</h3>
            <p className="text-gray-600">Your ID card generation history will appear here</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Template
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cards
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.slice(0, 10).map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.template_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.data_file_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.generated_cards} / {item.total_cards}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm text-gray-500 capitalize">
                            {item.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.status === 'completed' && item.pdf_url && (
                          <button
                            onClick={() => handleDownloadPDF(item.id, `${item.template_name}_cards.pdf`)}
                            className="text-primary-600 hover:text-primary-900 flex items-center space-x-1"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard