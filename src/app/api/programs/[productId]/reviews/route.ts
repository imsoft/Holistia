import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ productId: string }> };

/** GET: listar reseñas y estadísticas del programa */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const supabase = await createClient();

    const [statsRes, reviewsRes] = await Promise.all([
      supabase
        .from("digital_product_review_stats")
        .select("total_reviews, average_rating")
        .eq("product_id", productId)
        .maybeSingle(),
      supabase
        .from("digital_product_reviews")
        .select("id, purchase_id, buyer_id, rating, comment, created_at, updated_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    const stats = statsRes.data
      ? {
          total_reviews: statsRes.data.total_reviews ?? 0,
          average_rating: Number(statsRes.data.average_rating) || 0,
        }
      : { total_reviews: 0, average_rating: 0 };

    const reviews = reviewsRes.data || [];
    const buyerIds = [...new Set(reviews.map((r) => r.buyer_id))];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name")
      .in("id", buyerIds);

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const reviewsWithAuthor = reviews.map((r) => ({
      id: r.id,
      purchase_id: r.purchase_id,
      buyer_id: r.buyer_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      updated_at: r.updated_at,
      author_name:
        profileMap.get(r.buyer_id)?.first_name && profileMap.get(r.buyer_id)?.last_name
          ? `${profileMap.get(r.buyer_id)!.first_name} ${profileMap.get(r.buyer_id)!.last_name}`.trim()
          : "Comprador verificado",
    }));

    return NextResponse.json({
      stats,
      reviews: reviewsWithAuthor,
    });
  } catch (error) {
    console.error("Error fetching program reviews:", error);
    return NextResponse.json({ error: "Error al cargar reseñas" }, { status: 500 });
  }
}

/** POST: crear reseña (solo comprador verificado) */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: "productId requerido" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { purchase_id, rating, comment } = body;

    if (!purchase_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "purchase_id y rating (1-5) son requeridos" },
        { status: 400 }
      );
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from("digital_product_purchases")
      .select("id, product_id, buyer_id, payment_status, access_granted")
      .eq("id", purchase_id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    if (purchase.product_id !== productId) {
      return NextResponse.json({ error: "La compra no corresponde a este programa" }, { status: 400 });
    }

    if (purchase.buyer_id !== user.id) {
      return NextResponse.json({ error: "No puedes reseñar esta compra" }, { status: 403 });
    }

    if (purchase.payment_status !== "succeeded" || !purchase.access_granted) {
      return NextResponse.json(
        { error: "Solo puedes reseñar después de que tu compra esté confirmada" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("digital_product_reviews")
      .select("id")
      .eq("purchase_id", purchase_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Ya dejaste una reseña para esta compra" },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("digital_product_reviews")
      .insert({
        product_id: productId,
        purchase_id,
        buyer_id: user.id,
        rating: Number(rating),
        comment: typeof comment === "string" && comment.trim() ? comment.trim() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting program review:", insertError);
      return NextResponse.json({ error: "Error al publicar la reseña" }, { status: 500 });
    }

    return NextResponse.json({ success: true, review: inserted });
  } catch (error) {
    console.error("Error creating program review:", error);
    return NextResponse.json({ error: "Error al publicar la reseña" }, { status: 500 });
  }
}
