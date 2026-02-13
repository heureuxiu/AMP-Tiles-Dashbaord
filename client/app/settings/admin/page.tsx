"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { UserCog, Lock, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function AdminAccountPage() {
  const { user, updateUser, updatePassword } = useAuth();
  const [adminName, setAdminName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);

  // Load user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setAdminName(user.name);
    }
  }, [user]);

  const handleUpdateName = async () => {
    if (!adminName.trim()) {
      toast.error("Admin name cannot be empty");
      return;
    }

    if (!user) return;

    setIsSavingName(true);
    try {
      await updateUser(adminName, user.email);
      toast.success("Name updated successfully", {
        description: "Your admin name has been updated",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please try again";
      toast.error("Failed to update name", {
        description: errorMessage,
      });
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdatePassword = async () => {
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success("Password updated successfully", {
        description: "Your admin password has been changed",
      });
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please check your current password";
      toast.error("Failed to update password", {
        description: errorMessage,
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancel = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.info("Password change cancelled");
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Admin Account
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Manage your admin account information and password
          </p>
        </div>
      </div>

      {/* Account Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#8b5cf615" }}
            >
              <UserCog className="h-5 w-5" style={{ color: "#8b5cf6" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Account Information
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Your admin profile details
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Admin Name */}
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name (Optional)</Label>
              <Input
                id="adminName"
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="Enter admin name"
              />
            </div>

            {/* Admin Email */}
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email</Label>
              <Input
                id="adminEmail"
                type="email"
                value={user?.email || ""}
                readOnly
                className="bg-neutral-50 dark:bg-neutral-900"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Email address cannot be changed
              </p>
            </div>

            {/* Save Name Button */}
            {adminName !== user?.name && (
              <div className="pt-2">
                <Button
                  onClick={handleUpdateName}
                  disabled={isSavingName}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  <Save className="h-4 w-4" />
                  {isSavingName ? "Saving..." : "Save Name"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:border-neutral-700/60 dark:bg-neutral-800"
      >
        {/* Header */}
        <div className="border-b border-neutral-200/60 p-6 dark:border-neutral-700/60">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "#f59e0b15" }}
            >
              <Lock className="h-5 w-5" style={{ color: "#f59e0b" }} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 dark:text-white">
                Change Password
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Update your account password
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Password must be at least 8 characters long
              </p>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdatePassword}
                disabled={isChangingPassword}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
              >
                <Save className="h-4 w-4" />
                {isChangingPassword ? "Updating..." : "Update Password"}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isChangingPassword}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
