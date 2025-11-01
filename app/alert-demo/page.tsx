"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandedAlert } from "@/components/ui/branded-alert";
import { BrandedAlertDialog } from "@/components/ui/branded-alert-dialog";
import { brandedToast } from "@/components/ui/branded-toast";
import { useBrandedAlerts } from "@/hooks/use-branded-alerts";

export default function AlertDemo() {
  const [showDialog, setShowDialog] = useState(false);
  const { showSuccess, showInfo, showWarning, showError } = useBrandedAlerts();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Branded Alert System Demo</h1>
        <p className="text-gray-600">CCA School Management System - New Alert UI</p>
      </div>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Toast Notifications</CardTitle>
          <CardDescription>Click buttons to see branded toast notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => brandedToast.success("Operation completed successfully!")}
              className="bg-green-600 hover:bg-green-700"
            >
              Success Toast
            </Button>
            <Button 
              onClick={() => brandedToast.info("Here's some helpful information.")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Info Toast
            </Button>
            <Button 
              onClick={() => brandedToast.warning("Please review this carefully.")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Warning Toast
            </Button>
            <Button 
              onClick={() => brandedToast.error("Something went wrong!")}
              className="bg-red-600 hover:bg-red-700"
            >
              Error Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inline Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Inline Alerts</CardTitle>
          <CardDescription>Branded alert components with CCA logo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrandedAlert
            variant="success"
            title="Success!"
            description="Your data has been saved successfully."
          />
          
          <BrandedAlert
            variant="info"
            title="Information"
            description="This is some important information you should know."
          />
          
          <BrandedAlert
            variant="warning"
            title="Warning"
            description="Please review your input before proceeding."
          />
          
          <BrandedAlert
            variant="error"
            title="Error"
            description="There was an error processing your request."
          />
        </CardContent>
      </Card>

      {/* Dismissible Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Dismissible Alerts</CardTitle>
          <CardDescription>Alerts that can be dismissed by the user</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BrandedAlert
            variant="info"
            title="Dismissible Alert"
            description="This alert can be dismissed by clicking the X button."
            dismissible
            onDismiss={() => console.log('Alert dismissed')}
          />
        </CardContent>
      </Card>

      {/* Alert Dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Alert Dialog</CardTitle>
          <CardDescription>Modal-style alerts with CCA branding</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => setShowDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Show Alert Dialog
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Hook Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Hook Usage</CardTitle>
          <CardDescription>Using the useBrandedAlerts hook for programmatic alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              onClick={() => showSuccess("Success via hook!")}
              className="bg-green-600 hover:bg-green-700"
            >
              Hook Success
            </Button>
            <Button 
              onClick={() => showInfo("Info via hook!")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Hook Info
            </Button>
            <Button 
              onClick={() => showWarning("Warning via hook!")}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Hook Warning
            </Button>
            <Button 
              onClick={() => showError("Error via hook!")}
              className="bg-red-600 hover:bg-red-700"
            >
              Hook Error
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Dialog Modal */}
      <BrandedAlertDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        variant="info"
        title="Welcome to CCA"
        description="This is a branded alert dialog with the CCA logo and consistent styling."
        confirmText="Got it"
        cancelText="Cancel"
        onConfirm={() => console.log('Confirmed')}
        onCancel={() => console.log('Cancelled')}
      />
    </div>
  );
}
