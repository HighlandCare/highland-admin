"use client";

import { AdminTable } from "../components/AdminTable";
import { categoriesList, cmsPages } from "../data/dummy";

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Service Category & Content Management</h1>
        <p className="mt-1">Category manager for 12 main categories and sub-categories; CMS for static pages; content moderation.</p>
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Category Manager</h2>
        <p className="mb-4 text-sm">Create, configure, enable/disable categories; icons, descriptions, default attributes.</p>
        <AdminTable
          columns={[
            { key: "id", header: "ID" },
            { key: "name", header: "Category" },
            { key: "subCount", header: "Sub-categories" },
            { key: "enabled", header: "Enabled", render: (r) => (r.enabled ? "Yes" : "No") },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Edit</button> },
          ]}
          data={categoriesList}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">CMS – Static pages</h2>
        <p className="mb-4 text-sm">About Us, Terms, Privacy, category-specific guidelines (e.g. Babysitter Safety Protocols).</p>
        <AdminTable
          columns={[
            { key: "slug", header: "Slug" },
            { key: "title", header: "Title" },
            { key: "updated", header: "Last updated" },
            { key: "actions", header: "Actions", render: () => <button type="button" className="text-sm font-medium underline">Edit</button> },
          ]}
          data={cmsPages}
          pageSize={10}
        />
      </div>

      <div className="admin-content-card p-6">
        <h2 className="mb-4 font-medium">Content moderation</h2>
        <p className="text-sm">Moderate reviews and provider portfolio images; hide or remove inappropriate content.</p>
      </div>
    </div>
  );
}
