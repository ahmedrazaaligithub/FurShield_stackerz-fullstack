import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { userAPI, uploadAPI } from "../../services/api";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { getAvatarUrl } from "../../utils/imageUtils";
import {
  UserCircleIcon,
  CameraIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { uploadImageToCloudinary } from "../../utils/uploadImage";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    bio: user?.bio || "",
    // avatar: user?.avatar || "",
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: userAPI.getProfile,
    initialData: { data: { data: user } },
  });
  console.log('profile----->',profile);
  

  const updateMutation = useMutation({
    mutationFn: userAPI.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      updateProfile(data.data.data);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update profile");
    },
  });

  const avatarMutation = useMutation({
    mutationFn: userAPI.uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
      updateProfile(data.data.data);
      toast.success("Avatar updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to upload avatar");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      bio: user?.bio || "",
    });
    setIsEditing(false);
  };

  const handleAvatarChange = async (e) => {
    if (!e) return;
    uploadImageToCloudinary(e.target.files[0]).then((data) => {
      avatarMutation.mutate(data.url);
      e.target.value = null;
    })
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentUser = profile?.data?.data || user;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <div className="card p-6 text-center">
            <div className="relative inline-block">
              <img
                src={getAvatarUrl(currentUser?.avatar)}
                alt={currentUser?.name || "User"}
                className="h-32 w-32 rounded-full object-cover mx-auto"
                onError={(e) => {
                  e.target.src = `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                  }/public/default-avatar.svg`;
                }}
              />

              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700 transition-colors">
                <CameraIcon className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={avatarMutation.isPending}
                />
              </label>

              {avatarMutation.isPending && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mt-4">
              {currentUser?.name}
            </h2>
            <p className="text-gray-600 capitalize">{currentUser?.role}</p>
            {currentUser?.isVetVerified && (
              <div className="mt-2">
                <span className="badge badge-success">
                  Verified Veterinarian
                </span>
              </div>
            )}
            <div className="mt-4">
              {currentUser?.bio ? (
                <p className="text-sm text-gray-700 italic">
                  "{currentUser.bio}"
                </p>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Add a bio to tell others about yourself
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="card-content">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="label">Role</label>
                      <input
                        type="text"
                        value={currentUser?.role}
                        className="input bg-gray-50"
                        disabled
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows={3}
                      className="textarea"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      className="textarea"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="btn btn-primary"
                    >
                      {updateMutation.isPending ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <CheckIcon className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={handleCancel}
                      className="btn btn-outline"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="label">Full Name</label>
                      <p className="text-gray-900">{currentUser?.name}</p>
                    </div>

                    <div>
                      <label className="label">Email</label>
                      <p className="text-gray-900">{currentUser?.email}</p>
                      {!currentUser?.isEmailVerified && (
                        <span className="badge badge-warning mt-1">
                          Unverified
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="label">Phone</label>
                      <p className="text-gray-900">{currentUser?.phone}</p>
                    </div>

                    <div>
                      <label className="label">Role</label>
                      <p className="text-gray-900 capitalize">
                        {currentUser?.role}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="label">Address</label>
                    <p className="text-gray-900">{currentUser?.address}</p>
                  </div>

                  {currentUser?.bio && (
                    <div>
                      <label className="label">Bio</label>
                      <p className="text-gray-900">{currentUser.bio}</p>
                    </div>
                  )}

                  <div>
                    <label className="label">Member Since</label>
                    <p className="text-gray-900">
                      {new Date(currentUser?.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Account Actions
          </h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            {currentUser?.role === "vet" && !currentUser?.isVetVerified && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800">
                  Veterinarian Verification
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Complete your veterinarian verification to start accepting
                  appointments.
                </p>
                <button className="btn btn-sm bg-yellow-600 text-white hover:bg-yellow-700 mt-3">
                  Start Verification
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-4">
              <button className="btn btn-outline">Change Password</button>
              <button className="btn btn-outline">Download My Data</button>
              <button className="btn btn-outline text-red-600 border-red-300 hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
