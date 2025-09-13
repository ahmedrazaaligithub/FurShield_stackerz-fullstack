import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI } from '../../services/api'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { 
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline'
import { cn } from '../../utils/cn'
import toast from 'react-hot-toast'
const UserRow = ({ user, onEdit, onDelete, onToggleStatus }) => (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        {user.avatar ? (
          <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={cn(
        'badge',
        user.role === 'admin' ? 'badge-error' :
        user.role === 'vet' ? 'badge-primary' :
        user.role === 'shelter' ? 'badge-secondary' :
        'badge-success'
      )}>
        {user.role}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={cn(
        'badge',
        user.isActive ? 'badge-success' : 'badge-error'
      )}>
        {user.isActive ? 'active' : 'inactive'}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {new Date(user.createdAt).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(user)}
          className="text-primary-600 hover:text-primary-900"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onToggleStatus(user)}
          className={cn(
            'hover:opacity-75',
            user.isActive ? 'text-yellow-600' : 'text-green-600'
          )}
        >
          {user.isActive ? (
            <ShieldExclamationIcon className="h-4 w-4" />
          ) : (
            <ShieldCheckIcon className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(user)}
          className="text-red-600 hover:text-red-900"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </td>
  </tr>
)
export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', { search: searchQuery, role: roleFilter, status: statusFilter }],
    queryFn: () => adminAPI.getUsers({
      search: searchQuery || undefined,
      role: roleFilter || undefined,
      status: statusFilter || undefined
    })
  })
  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateUser(id, data),
    onSuccess: () => {
      toast.success('User updated successfully')
      queryClient.invalidateQueries(['admin-users'])
      setShowEditModal(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update user')
    }
  })
  const deleteUserMutation = useMutation({
    mutationFn: adminAPI.deleteUser,
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete user')
    }
  })
  const handleEdit = (user) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }
  const handleDelete = (user) => {
    if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUserMutation.mutate(user._id)
    }
  }
  const handleToggleStatus = (user) => {
    const newStatus = user.isActive ? 'inactive' : 'active'
    updateUserMutation.mutate({
      id: user._id,
      data: { status: newStatus }
    })
  }
  const userList = users?.data?.data || []
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600 mt-1">Manage platform users and permissions</p>
      </div>
      <div className="card p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="vet">Veterinarian</option>
            <option value="shelter">Shelter</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input lg:w-48"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Users</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FunnelIcon className="h-4 w-4" />
              <span>{userList.length} users</span>
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : userList.length === 0 ? (
          <div className="text-center py-12">
            <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userList.map((user) => (
                  <UserRow
                    key={user._id}
                    user={user}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Edit User: {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">Role</label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({...selectedUser, role: e.target.value})}
                  className="input w-full"
                >
                  <option value="user">User</option>
                  <option value="vet">Veterinarian</option>
                  <option value="shelter">Shelter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  value={selectedUser.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setSelectedUser({...selectedUser, isActive: e.target.value === 'active'})}
                  className="input w-full"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => updateUserMutation.mutate({
                  id: selectedUser._id,
                  data: { role: selectedUser.role, status: selectedUser.isActive ? 'active' : 'inactive' }
                })}
                disabled={updateUserMutation.isPending}
                className="btn btn-primary flex-1"
              >
                {updateUserMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : null}
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="btn btn-outline flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}