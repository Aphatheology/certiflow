import { SavedProject, CertificateField } from "../types";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "certiflow_projects";

export const storageService = {
  getAllProjects: (): SavedProject[] => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Failed to load projects", e);
      return [];
    }
  },

  saveProject: (
    name: string,
    imageUrl: string | null,
    fields: CertificateField[],
    existingId?: string
  ): SavedProject => {
    const projects = storageService.getAllProjects();
    const now = Date.now();

    let project: SavedProject;

    if (existingId) {
      const index = projects.findIndex((p) => p.id === existingId);
      if (index !== -1) {
        projects[index] = {
          ...projects[index],
          name,
          imageUrl,
          fields,
          updatedAt: now,
        };
        project = projects[index];
      } else {
        // Fallback if ID not found
        project = { id: uuidv4(), name, imageUrl, fields, updatedAt: now };
        projects.push(project);
      }
    } else {
      project = {
        id: uuidv4(),
        name,
        imageUrl,
        fields,
        updatedAt: now,
      };
      projects.push(project);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      throw new Error(
        "Storage limit reached! Try deleting old projects or using a smaller background image."
      );
    }

    return project;
  },

  deleteProject: (id: string) => {
    const projects = storageService.getAllProjects().filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  },
};
