export type CategoryRef = {
  id: string;
  name: string;
} | null;

export interface Recipe {
  id: string;
  title: string;
  summary?: string;
  image: string;
  description: string;
  ingredients: string[];
  steps: string[];
  category: CategoryRef;
  subcategory: CategoryRef;
  category_id?: string | null;
  subcategory_id?: string | null;
  isDeleted: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string | null;
  updatedAt?: Date | null;
}

export type CategoryOption = {
  id: string;
  name: string;
  parent_id: string | null;
};
