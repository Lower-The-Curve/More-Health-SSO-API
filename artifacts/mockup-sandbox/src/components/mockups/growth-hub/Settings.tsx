import "./_group.css";
import React from "react";
import { AppLayout } from "./_shared/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, MapPin, Shield, History, Network, Globe } from "lucide-react";

export function Settings() {
  const SUBNAV = [
    { icon: User, label: "Profile", active: true },
    { icon: MapPin, label: "Addresses", active: false },
    { icon: Shield, label: "Security", active: false },
    { icon: History, label: "Account Records", active: false },
    { icon: Network, label: "Placement", active: false },
    { icon: Globe, label: "Language", active: false },
  ];

  return (
    <AppLayout activeId="settings">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your account preferences and information.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left Sub-nav */}
          <div className="w-full md:w-64 shrink-0 space-y-1">
            {SUBNAV.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  item.active 
                    ? "bg-secondary text-foreground" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Content */}
          <Card className="flex-1 shadow-sm border-border/50 rounded-2xl bg-card">
            <div className="p-6 sm:p-8 border-b border-border/50">
              <h2 className="text-xl font-semibold">Profile Information</h2>
              <p className="text-sm text-muted-foreground mt-1">Update your personal details and public profile.</p>
            </div>
            
            <CardContent className="p-6 sm:p-8 space-y-8">
              {/* Avatar Section */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 border-2 border-background shadow-sm ring-1 ring-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">BC</AvatarFallback>
                  <AvatarImage src="https://i.pravatar.cc/150?u=brady" />
                </Avatar>
                <div>
                  <Button variant="outline" className="shadow-sm rounded-xl mb-2">Upload new photo</Button>
                  <p className="text-xs text-muted-foreground">Recommended: Square JPG, PNG. Max 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Brady" className="bg-secondary/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name / 姓</Label>
                  <Input id="lastName" defaultValue="Chen 陈" className="bg-secondary/30 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue="brady.chen@example.com" className="bg-secondary/30 rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+86 138 0000 0000" className="bg-secondary/30 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" defaultValue="1990-05-15" className="bg-secondary/30 rounded-xl text-muted-foreground" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lang">Preferred Language</Label>
                  <div className="relative">
                    <select id="lang" className="flex h-9 w-full rounded-xl border border-input bg-secondary/30 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none">
                      <option>English</option>
                      <option>Simplified Chinese (简体中文)</option>
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 flex justify-end gap-3">
                <Button variant="ghost" className="rounded-xl">Cancel</Button>
                <Button className="rounded-xl shadow-sm px-8">Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </AppLayout>
  );
}
