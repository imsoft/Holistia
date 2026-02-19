import { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { generateBlogMetadata, generateStructuredData } from "@/lib/seo";
import { StructuredData } from "@/components/seo/structured-data";
import { BlogPostClient } from "@/app/(website)/blog/[slug]/blog-post-client";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const { data: post, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error || !post) {
      return {
        title: "Artículo no encontrado | Blog Holistia",
        description: "El artículo que buscas no está disponible.",
      };
    }

    let authorName = "Holistia";
    let authorProfession = "Equipo Holistia";

    if (post.author_id) {
      const { data: professionalAuthor } = await supabase
        .from("professional_applications")
        .select("first_name, last_name, profession")
        .eq("user_id", post.author_id)
        .eq("status", "approved")
        .single();

      if (professionalAuthor) {
        authorName = `${professionalAuthor.first_name} ${professionalAuthor.last_name}`;
        authorProfession = professionalAuthor.profession;
      } else {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, type")
          .eq("id", post.author_id)
          .single();

        if (profileData) {
          authorName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || "Holistia";
          authorProfession = profileData.type === "Admin" || profileData.type === "admin" ? "Equipo Holistia" : "Colaborador";
        }
      }
    }

    const blogPost = {
      ...post,
      author: { name: authorName, profession: authorProfession },
    };

    return generateBlogMetadata(blogPost);
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Error | Blog Holistia",
      description: "Error al cargar el artículo.",
    };
  }
}

export default async function PatientBlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (postError || !post) {
      notFound();
    }

    let authorInfo = undefined;
    if (post.author_id) {
      let professionalAuthor = null;
      const { data: professionalByUserId, error: professionalAuthorError } = await supabase
        .from("professional_applications")
        .select("id, first_name, last_name, profession, profile_photo, slug, status")
        .eq("user_id", post.author_id)
        .maybeSingle();

      if (professionalAuthorError && professionalAuthorError.code !== "PGRST116") {
        console.error("Error fetching professional author:", professionalAuthorError);
      }

      professionalAuthor = professionalByUserId;

      if (!professionalAuthor) {
        const { data: professionalById } = await supabase
          .from("professional_applications")
          .select("id, first_name, last_name, profession, profile_photo, slug, status")
          .eq("id", post.author_id)
          .maybeSingle();
        professionalAuthor = professionalById;
      }

      if (professionalAuthor) {
        const generatedSlug =
          professionalAuthor.slug ||
          `${professionalAuthor.first_name?.toLowerCase() || ""}-${professionalAuthor.last_name?.toLowerCase() || ""}-${professionalAuthor.id}`.replace(/\s+/g, "-");

        authorInfo = {
          name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
          profession: professionalAuthor.profession,
          avatar: professionalAuthor.profile_photo,
          professionalId: professionalAuthor.id,
          professionalSlug: generatedSlug,
          isProfessional: professionalAuthor.status === "approved",
        };
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, type, avatar_url")
          .eq("id", post.author_id)
          .maybeSingle();

        if (profileError && profileError.code !== "PGRST116") {
          console.error("Error fetching profile:", profileError);
        }

        if (profileData) {
          const fullName = `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim();
          if (fullName) {
            let professionalByName = null;
            const { data: exactMatch } = await supabase
              .from("professional_applications")
              .select("id, slug, first_name, last_name, profession, profile_photo")
              .ilike("first_name", profileData.first_name || "")
              .ilike("last_name", profileData.last_name || "")
              .maybeSingle();

            professionalByName = exactMatch;

            if (!professionalByName) {
              const { data: allProfessionals } = await supabase
                .from("professional_applications")
                .select("id, slug, first_name, last_name, profession, profile_photo")
                .limit(1000);

              if (allProfessionals && allProfessionals.length > 0) {
                const normalizedFullName = fullName.toLowerCase().trim();
                professionalByName = allProfessionals.find((p) => {
                  const profFullName = `${p.first_name} ${p.last_name}`.toLowerCase().trim();
                  return profFullName === normalizedFullName;
                });
              }
            }

            if (professionalByName) {
              const generatedSlug =
                professionalByName.slug ||
                `${professionalByName.first_name?.toLowerCase() || profileData.first_name?.toLowerCase() || ""}-${professionalByName.last_name?.toLowerCase() || profileData.last_name?.toLowerCase() || ""}-${professionalByName.id}`.replace(/\s+/g, "-");

              authorInfo = {
                name: fullName || "Holistia",
                profession: professionalByName.profession || (profileData.type === "Admin" || profileData.type === "admin" ? "Equipo Holistia" : "Colaborador"),
                avatar: professionalByName.profile_photo || profileData.avatar_url || undefined,
                professionalId: professionalByName.id,
                professionalSlug: generatedSlug,
                isProfessional: true,
              };
            } else {
              authorInfo = {
                name: fullName || "Holistia",
                profession: profileData.type === "Admin" || profileData.type === "admin" ? "Equipo Holistia" : "Colaborador",
                avatar: profileData.avatar_url || undefined,
                isProfessional: false,
              };
            }
          } else {
            authorInfo = {
              name: "Holistia",
              profession: "Equipo Holistia",
              avatar: profileData.avatar_url || undefined,
              isProfessional: false,
            };
          }
        } else {
          authorInfo = {
            name: "Holistia",
            profession: "Equipo Holistia",
            avatar: undefined,
            isProfessional: false,
          };
        }
      }
    }

    const { data: relatedPosts } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("status", "published")
      .neq("id", post.id)
      .limit(3)
      .order("published_at", { ascending: false });

    const relatedBlogPosts = await Promise.all(
      (relatedPosts || []).map(async (relatedPost) => {
        let relatedAuthorInfo = undefined;

        if (relatedPost.author_id) {
          const { data: professionalAuthor, error: relatedProfessionalError } = await supabase
            .from("professional_applications")
            .select("first_name, last_name, profession")
            .eq("user_id", relatedPost.author_id)
            .eq("status", "approved")
            .maybeSingle();

          if (relatedProfessionalError && relatedProfessionalError.code !== "PGRST116") {
            console.error("Error fetching related professional author:", relatedProfessionalError);
          }

          if (professionalAuthor) {
            relatedAuthorInfo = {
              name: `${professionalAuthor.first_name} ${professionalAuthor.last_name}`,
              profession: professionalAuthor.profession,
            };
          } else {
            const { data: profileData, error: relatedProfileError } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, type")
              .eq("id", relatedPost.author_id)
              .maybeSingle();

            if (relatedProfileError && relatedProfileError.code !== "PGRST116") {
              console.error("Error fetching related profile:", relatedProfileError);
            }

            if (profileData) {
              relatedAuthorInfo = {
                name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || "Holistia",
                profession: profileData.type === "Admin" || profileData.type === "admin" ? "Equipo Holistia" : "Colaborador",
              };
            }
          }
        }

        return {
          ...relatedPost,
          author: relatedAuthorInfo,
        };
      })
    );

    const blogPost = {
      ...post,
      author: authorInfo,
    };

    const structuredData = generateStructuredData("blog", blogPost);

    return (
      <>
        <StructuredData data={structuredData} />
        <BlogPostClient post={blogPost} relatedPosts={relatedBlogPosts} basePath="/patient/blog" />
      </>
    );
  } catch (error) {
    console.error("Error fetching blog post:", error);
    notFound();
  }
}
