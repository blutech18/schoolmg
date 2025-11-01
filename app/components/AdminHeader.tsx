"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AdminHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
}

export function AdminHeader({ 
  className, 
  title = "Admin Dashboard",
  description,
  ...props 
}: AdminHeaderProps) {
  return (
    <div 
      className={cn("flex flex-col space-y-2 pb-4", className)}
      {...props}
    >
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}

export default AdminHeader;
