import { API_URL } from "astro:env/client";
import { repositoryUrl } from "virtual:build-meta/git";

export interface NavigationItem {
  name: string;
  icon?: string;
  href?: string;
  expandable?: boolean;
  items?: NavigationItem[];
  expanded?: boolean;
}

export interface BaseNavigationItem {
  name: string;
  href: string;
}

export interface NavigationItemWithIcon extends BaseNavigationItem {
  expandable?: boolean
  icon: string;
  items?: NavigationItemWithIcon[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItemWithIcon[];
}

export const mainSections: NavigationSection[] = [
  {
    title: "Overview",
    items: [
      {
        icon: "lucide:home",
        name: "Getting Started",
        href: "/",
      },
      {
        icon: "lucide:star",
        name: "Categories",
        href: "/categories",
        expandable: true,
        items: [
          {
            name: "Animals & Nature",
            href: "/categories/animals-nature",
            icon: "lucide:cat",
          }
        ],
      },
    ]
  },
  {
    title: "Tools",
    items: [
      {
        name: "Lucky?",
        icon: "lucide:clover",
        href: API_URL + "/lucky",
      },
    ]
  }
];

export const resourcesSection: NavigationSection = {
  title: "Resources",
  items: [
    {
      icon: "lucide:book-open",
      name: "Documentation",
      href: "https://docs.mojis.dev",
    },
    {
      icon: "lucide:package",
      name: "API Reference",
      href: API_URL + "/scalar",
    },
    {
      icon: "lucide:github",
      name: "GitHub",
      href: repositoryUrl ?? "https://github.com/mojisdev/mojis",
    },
  ]
};
