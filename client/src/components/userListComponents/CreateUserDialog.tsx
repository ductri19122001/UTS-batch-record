"use client";

import React, { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import InputField from "./InputField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { UserListHeaderProps } from "../UserList";
import { useAuth0 } from "@auth0/auth0-react";
import ResultDialog from "./ResultDialog";
// ------------------- Schema -------------------
const userSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[A-Z]/, "Password must include an uppercase letter")
      .regex(
        /[-+_<>!@#$%^&*]/,
        "Password must contain one of following special characters: -+_<>!@#$%^&*"
      )
      .regex(/[0-9]/, "Password must include a number"),
    confirmPassword: z.string(),
    role: z.enum([
      "SUPERVISOR",
      "OPERATOR",
      "QA",
      "QC",
      "MAINTENANCE",
      "VIEWER",
      "ADMIN",
    ]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type UserForm = z.infer<typeof userSchema>;

const CreateUserDialog = ({ onSuccess }: UserListHeaderProps) => {
  const { getAccessTokenSilently } = useAuth0();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<UserForm>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "VIEWER",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserForm, string>>>(
    {}
  );
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [dialogProp, setDialogProp] = useState({
    message: "",
    type: "result" as "result" | "confirm" | "error",
  });
  const [isLoading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (
    value:
      | "SUPERVISOR"
      | "OPERATOR"
      | "QA"
      | "QC"
      | "MAINTENANCE"
      | "VIEWER"
      | "ADMIN"
  ) => {
    setForm((prev) => ({ ...prev, role: value }));
  };

  const handleCancelConfirm = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "VIEWER",
    });
    setErrors({});
    setDialogOpen(false);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = userSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof UserForm, string>> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          const key = err.path[0] as keyof UserForm;
          fieldErrors[key] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    } else {
      try {
        setLoading(true);
        const token = await getAccessTokenSilently();
        const response = await fetch(
          `${import.meta.env.VITE_API_SERVER_URL}/api/profiles`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              firstName: result.data.firstName,
              lastName: result.data.lastName,
              email: result.data.email,
              role: result.data.role,
              password: result.data.password,
            }),
          }
        );

        if (response.ok) {
          setLoading(false);
          setDialogProp({
            type: "result",
            message: "Create Account Successful!",
          });
          setDialogOpen(true);
          onSuccess();
        } else {
          setLoading(false);
          setDialogProp({
            type: "error",
            message: `Failed to Create Account. \n Please try again`,
          });
          setDialogOpen(true);
          alert("Create User Failed");
        }
      } catch (error: any) {
        setLoading(false);
        console.error("Failed to create user request: ", error);
        alert("Failed to fetch create user request");
      }
    }

    setErrors({});
    setOpen(false);
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "VIEWER",
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* Button that opens the dialog */}
        <DialogTrigger asChild>
          <Button>Create User</Button>
        </DialogTrigger>

        {/* Popup content */}
        <DialogContent className="[&>button]:hidden sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>
              Fill in the fields to create new user.
            </DialogDescription>
          </DialogHeader>
          <Separator className="my-4" />
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <InputField
                  label="First Name"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <InputField
                  label="Last Name"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm">{errors.lastName}</p>
                )}
              </div>

              {/* Role */}
              <div className="flex flex-col gap-2 col-span-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={form.role} onValueChange={handleRoleChange}>
                  <SelectTrigger className="w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 py-5">
                    <SelectValue placeholder={form.role} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="OPERATOR">Operator</SelectItem>
                    <SelectItem value="QA">QA</SelectItem>
                    <SelectItem value="QC">QC</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="VIEWER">Viewer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-red-500 text-sm">{errors.role}</p>
                )}
              </div>

              {/* Email */}
              <div className="col-span-2 placeholder-gray-500">
                <InputField
                  label="Email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="col-span-2">
                <InputField
                  label="Password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="col-span-2">
                <InputField
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <DialogFooter className="mt-6">
              <Button
                variant="destructive"
                type="button"
                onClick={() => {
                  setDialogProp({
                    type: "confirm",
                    message:
                      "Are you sure you want to cancel? All progress will be lost.",
                  });
                  setDialogOpen(true);
                }}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={isLoading || !form}>
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <ResultDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        message={dialogProp.message}
        type={dialogProp.type}
        onConfirm={
          dialogProp.type === "confirm" ? handleCancelConfirm : undefined
        }
      />
    </>
  );
};
export default CreateUserDialog;

//make it so that when you click save it doesn't close the dialog if there are validation errors
//make it so that the placeholders hold the current user info and the input fields are empty
//make it so that the popup of "are you sure you want to cancel" prettier using shadcn components
