'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Plus, Edit2, Trash2, Save, X, Check,
  ChevronDown, ChevronRight, Users, Lock, Building2,
  Eye, Pencil, PackagePlus, Trash, AlertTriangle
} from 'lucide-react';
import { apiService } from '@/services/api';

interface Permission {
  key: string;
  module: string;
  action: string;
  description: string;
}

interface Role {
  id: string;
  roleKey?: string;
  name: string;
  description: string;
  permissions: string[];
  warehouseAccess: 'all' | 'assigned' | 'none';
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface GroupedPermissions {
  [module: string]: Permission[];
}

const ACTION_ICONS: Record<string, any> = {
  'View': Eye,
  'Create': PackagePlus,
  'Edit': Pencil,
  'Delete': Trash,
  'Approve': Check,
  'Process': Check,
  'Adjust': Edit2,
  'Transfer': Building2,
  'Assign': Users,
  'Execute': Check,
  'Print': Eye,
  'Print Labels': Eye,
  'Receive': PackagePlus,
  'Export': Eye,
  'Manage': Lock,
  'Cycle Count': Check,
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    warehouseAccess: 'assigned' as 'all' | 'assigned' | 'none'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        apiService.get('/roles'),
        apiService.get('/permissions')
      ]);

      setRoles(rolesRes.roles || []);

      // Convert permissions object to array
      const permsArray: Permission[] = Object.entries(permsRes.permissions || {}).map(([key, value]: [string, any]) => ({
        key,
        ...value
      }));
      setPermissions(permsArray);
      setGroupedPermissions(permsRes.grouped || {});

      // Expand all modules by default
      setExpandedModules(new Set(Object.keys(permsRes.grouped || {})));
    } catch (err: any) {
      setError('Failed to load data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: [...role.permissions],
      warehouseAccess: role.warehouseAccess
    });
    setIsEditing(false);
    setIsCreating(false);
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: [],
      warehouseAccess: 'assigned'
    });
    setIsEditing(false);
    setIsCreating(true);
  };

  const handlePermissionToggle = (permKey: string) => {
    if (!isEditing && !isCreating) return;

    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey]
    }));
  };

  const handleModuleToggle = (module: string) => {
    if (!isEditing && !isCreating) return;

    const modulePerms = groupedPermissions[module]?.map(p => p.key) || [];
    const allSelected = modulePerms.every(p => formData.permissions.includes(p));

    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !modulePerms.includes(p))
        : [...new Set([...prev.permissions, ...modulePerms])]
    }));
  };

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    try {
      setError('');

      if (isCreating) {
        await apiService.post('/roles', formData);
        setSuccess('Role created successfully');
      } else if (selectedRole && !selectedRole.isSystem) {
        await apiService.put(`/roles/${selectedRole.id}`, formData);
        setSuccess('Role updated successfully');
      }

      await loadData();
      setIsEditing(false);
      setIsCreating(false);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save role');
    }
  };

  const handleDelete = async () => {
    if (!selectedRole || selectedRole.isSystem) return;

    if (!confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) {
      return;
    }

    try {
      await apiService.delete(`/roles/${selectedRole.id}`);
      setSuccess('Role deleted successfully');
      setSelectedRole(null);
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete role');
    }
  };

  const handleCancel = () => {
    if (selectedRole) {
      setFormData({
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: [...selectedRole.permissions],
        warehouseAccess: selectedRole.warehouseAccess
      });
    }
    setIsEditing(false);
    setIsCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Roles & Permissions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage user roles and their access permissions</p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Create Role
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="h-5 w-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-400">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Available Roles</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {roles.length} roles ({roles.filter(r => r.isSystem).length} system, {roles.filter(r => !r.isSystem).length} custom)
              </p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {roles.map(role => (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role)}
                  className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {role.isSystem ? (
                        <Lock className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Shield className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-white">{role.name}</span>
                    </div>
                    {role.isSystem && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                        System
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{role.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{role.permissions.length} permissions</span>
                    <span>•</span>
                    <span className="capitalize">{role.warehouseAccess} warehouse access</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {isCreating ? 'Create New Role' : selectedRole ? `${selectedRole.name} Permissions` : 'Select a Role'}
                </h2>
                {selectedRole && !isCreating && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{selectedRole.description}</p>
                )}
              </div>

              {(selectedRole || isCreating) && (
                <div className="flex items-center gap-2">
                  {isEditing || isCreating ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1 px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      {selectedRole && !selectedRole.isSystem && (
                        <>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </>
                      )}
                      {selectedRole?.isSystem && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Lock className="h-4 w-4" />
                          System roles cannot be modified
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            {(selectedRole || isCreating) ? (
              <div className="p-4">
                {/* Role Name and Description for editing/creating */}
                {(isEditing || isCreating) && (
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Quality Inspector"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Describe this role's responsibilities"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Warehouse Access
                      </label>
                      <select
                        value={formData.warehouseAccess}
                        onChange={(e) => setFormData(prev => ({ ...prev, warehouseAccess: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Warehouses</option>
                        <option value="assigned">Assigned Warehouses Only</option>
                        <option value="none">No Warehouse Access</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Permissions Matrix */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">Permissions</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formData.permissions.length} / {permissions.length} selected
                    </span>
                  </div>

                  <div className="space-y-1 max-h-[400px] overflow-y-auto">
                    {Object.entries(groupedPermissions).map(([module, perms]) => {
                      const modulePerms = perms.map(p => p.key);
                      const selectedCount = modulePerms.filter(p => formData.permissions.includes(p)).length;
                      const isExpanded = expandedModules.has(module);
                      const allSelected = selectedCount === modulePerms.length;
                      const someSelected = selectedCount > 0 && selectedCount < modulePerms.length;

                      return (
                        <div key={module} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                          <div
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            onClick={() => toggleModule(module)}
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="font-medium text-gray-900 dark:text-white">{module}</span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({selectedCount}/{modulePerms.length})
                              </span>
                            </div>
                            {(isEditing || isCreating) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleModuleToggle(module);
                                }}
                                className={`px-2 py-1 text-xs rounded ${
                                  allSelected
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    : someSelected
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                }`}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-3 space-y-2 bg-white dark:bg-gray-800">
                              {perms.map(perm => {
                                const isSelected = formData.permissions.includes(perm.key);
                                const IconComponent = ACTION_ICONS[perm.action] || Eye;

                                return (
                                  <label
                                    key={perm.key}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                                      isEditing || isCreating
                                        ? 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                        : ''
                                    } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handlePermissionToggle(perm.key)}
                                      disabled={!isEditing && !isCreating}
                                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                                    />
                                    <IconComponent className={`h-4 w-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>
                                          {perm.action}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                          {perm.key}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {perm.description}
                                      </p>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Shield className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p>Select a role from the list to view its permissions</p>
                <p className="text-sm mt-2">Or create a new custom role</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Reference */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Role Templates Quick Reference</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roles.filter(r => r.isSystem).slice(0, 8).map(role => (
            <div key={role.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white text-sm">{role.name}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{role.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                  {role.permissions.length} perms
                </span>
                <span className="capitalize">{role.warehouseAccess}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
