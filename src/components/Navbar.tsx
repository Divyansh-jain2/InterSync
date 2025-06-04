'use client';

import Link from "next/link";
import { ModeToggle } from "./ModeToggle";
import { CodeIcon } from "lucide-react";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import DashboardBtn from "./DashboardBtn";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Navbar() {
  const { user } = useUser(); // Get the current user from Clerk

  // Ensure user ID is defined before making queries or mutations
  const clerkId = user?.id || ""; // Default to an empty string if undefined

  // Always call useQuery, even if clerkId is an empty string
  const currentUser = useQuery(api.users.getUserByClerkId, { clerkId });

  const updateUserRole = useMutation(api.users.updateUserRole); // Mutation to update the user role

  const [selectedRole, setSelectedRole] = useState<"candidate" | "interviewer" | "admin">("candidate"); // Default to "candidate"

  // Update the selected role when the current user is fetched
  useEffect(() => {
    if (currentUser?.role) {
      setSelectedRole(currentUser.role);
    }
  }, [currentUser]);

  const handleRoleChange = async (role: "candidate" | "interviewer" | "admin") => {
    if (!clerkId) return; // Ensure clerkId is defined
    setSelectedRole(role); // Update the local state
    await updateUserRole({ clerkId, role }); // Update the role in the database
  };

  // Return early if clerkId is undefined
  if (!user) {
    return null; // Return null or a loading state if user is not available
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* LEFT SIDE - LOGO */}
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-2xl mr-6 font-mono hover:opacity-80 transition-opacity"
        >
          <CodeIcon className="size-8 text-emerald-500" />
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            InterSync
          </span>
        </Link>

        {/* RIGHT SIDE - ACTIONS */}
        <SignedIn>
          <div className="flex items-center space-x-4 ml-auto">
            <DashboardBtn />
            <ModeToggle />

            {/* Role Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleRoleChange("candidate")}>
                  Candidate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("interviewer")}>
                  Interviewer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <UserButton />
          </div>
        </SignedIn>
      </div>
    </nav>
  );
}

export default Navbar;