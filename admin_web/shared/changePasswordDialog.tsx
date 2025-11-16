import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";
import axios from "axios";

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  email: string;
  isAdmin: boolean; // true for admin, false for machine
}

export default function ChangePasswordDialog({
  open,
  onClose,
  email,
  isAdmin,
}: ChangePasswordDialogProps) {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setPasswords({ current: "", new: "", confirm: "" });
    setErrors({ current: "", new: "", confirm: "" });
    onClose();
  };

  const validate = () => {
    const newErrors = { current: "", new: "", confirm: "" };
    let isValid = true;

    if (!passwords.current) {
      newErrors.current = "Current password is required";
      isValid = false;
    }

    if (!passwords.new) {
      newErrors.new = "New password is required";
      isValid = false;
    } else if (passwords.new.length < 6) {
      newErrors.new = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!passwords.confirm) {
      newErrors.confirm = "Please confirm your password";
      isValid = false;
    } else if (passwords.new !== passwords.confirm) {
      newErrors.confirm = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const endpoint = isAdmin
        ? `${baseUrl}/admin/changePassword`
        : `${baseUrl}/admin/machine/changePassword`;

      const res = await axios.post(
        endpoint,
        {
          email,
          currentPassword: passwords.current,
          newPassword: passwords.new,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("Token")}`,
          },
        }
      );

      if (res.status === 200) {
        alert("Password changed successfully!");
        handleClose();
      }
    } catch (e: any) {
      console.error("Failed to change password:", e);
      const errorMsg =
        e.response?.data?.error?.message ||
        "Failed to change password. Please check your current password and try again.";
      alert(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle className="bg-cblue text-white">
        Change Password - {email}
      </DialogTitle>
      <DialogContent>
        <div className="pt-4">
          {/* Current Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, current: e.target.value }))
              }
              className={`w-full p-2 px-4 border rounded-lg focus:outline-none focus:border-cblue focus:border-2 ${
                errors.current ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter current password"
              disabled={isLoading}
            />
            {errors.current && (
              <p className="text-red-500 text-xs mt-1">{errors.current}</p>
            )}
          </div>

          {/* New Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, new: e.target.value }))
              }
              className={`w-full p-2 px-4 border rounded-lg focus:outline-none focus:border-cblue focus:border-2 ${
                errors.new ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter new password"
              disabled={isLoading}
            />
            {errors.new && (
              <p className="text-red-500 text-xs mt-1">{errors.new}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) =>
                setPasswords((p) => ({ ...p, confirm: e.target.value }))
              }
              className={`w-full p-2 px-4 border rounded-lg focus:outline-none focus:border-cblue focus:border-2 ${
                errors.confirm ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Confirm new password"
              disabled={isLoading}
            />
            {errors.confirm && (
              <p className="text-red-500 text-xs mt-1">{errors.confirm}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-800">
              <strong>Password Requirements:</strong>
              <br />• Minimum 6 characters
              <br />• Make sure to remember your new password
            </p>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="px-6 py-2 bg-cblue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isLoading ? "Changing..." : "Change Password"}
        </button>
      </DialogActions>
    </Dialog>
  );
}
