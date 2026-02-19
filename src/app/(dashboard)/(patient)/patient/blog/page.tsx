import { createClient } from "@/utils/supabase/server";
import { StructuredData } from "@/components/seo/structured-data";
import { generateStructuredData } from "@/lib/seo";
import { BlogPageClient } from "@/app/(website)/blog/blog-page-client";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  published_at: string;
  updated_at: string;
  created_at: string;
  status: string;
  featured_image?: string;
  author_id?: string;
}

export default async function PatientBlogPage() {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error("Error fetching posts:", error);
    }

    const postsWithAuthors = await Promise.all(
      (data || []).map(async (post: BlogPost) => {
        let authorInfo = null;
        if (post.author_id) {
          const { data: professionalData } = await supabase
            .from("professional_applications")
            .select("id, first_name, last_name, email, profession, profile_photo")
            .eq("user_id", post.author_id)
            .eq("status", "approved")
            .maybeSingle();

          if (professionalData) {
            authorInfo = {
              id: professionalData.id,
              name: `${professionalData.first_name} ${professionalData.last_name}`,
              email: professionalData.email,
              avatar: professionalData.profile_photo,
              profession: professionalData.profession,
            };
          } else {
            const { data: profileData, error: profileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, email, type")
              .eq("id", post.author_id)
              .maybeSingle();

            if (profileError && profileError.code !== "PGRST116") {
              console.error("Error fetching profile:", profileError);
            }

            if (profileData) {
              authorInfo = {
                id: profileData.id,
                name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || "Holistia",
                email: profileData.email || "",
                avatar: undefined,
                profession: profileData.type === "Admin" || profileData.type === "admin" ? "Equipo Holistia" : "Colaborador",
              };
            } else {
              authorInfo = {
                id: post.author_id,
                name: "Holistia",
                email: "",
                avatar: undefined,
                profession: "Equipo Holistia",
              };
            }
          }
        }

        return {
          ...post,
          author: authorInfo || undefined,
        };
      })
    );

    const structuredData = generateStructuredData("website", {
      name: "Blog de Holistia",
      description: "Blog especializado en salud mental y bienestar",
    });

    return (
      <>
        <StructuredData data={structuredData} />
        <BlogPageClient posts={postsWithAuthors} basePath="/patient/blog" />
      </>
    );
  } catch (error) {
    console.error("Error:", error);
    const structuredData = generateStructuredData("website", {
      name: "Blog de Holistia",
      description: "Blog especializado en salud mental y bienestar",
    });

    return (
      <>
        <StructuredData data={structuredData} />
        <BlogPageClient posts={[]} error="Error inesperado al cargar los posts" basePath="/patient/blog" />
      </>
    );
  }
}
