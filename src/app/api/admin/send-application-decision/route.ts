import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  sendProfessionalApprovalEmail,
  sendProfessionalRejectionEmail
} from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the user is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.type !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get request data
    const {
      status,
      professional_name,
      professional_email,
      profession,
      review_notes,
      dashboard_url
    } = await request.json();

    if (!status || !professional_name || !professional_email || !profession) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send appropriate email based on status
    let result;
    if (status === 'approved') {
      result = await sendProfessionalApprovalEmail({
        professional_name,
        professional_email,
        profession,
        dashboard_url: dashboard_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://holistia.io'
      });
    } else if (status === 'rejected') {
      result = await sendProfessionalRejectionEmail({
        professional_name,
        professional_email,
        profession,
        review_notes
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    if (!result.success) {
      console.error('Failed to send email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send email', details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${status === 'approved' ? 'Approval' : 'Rejection'} email sent successfully`,
      emailId: result.id
    });

  } catch (error) {
    console.error('Error in send-application-decision endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
