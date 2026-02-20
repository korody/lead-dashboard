import { NextResponse } from 'next/server'
import { activeCampaignClient } from '@/lib/activecampaign'

/**
 * GET /api/ac-fields
 * Lista todos os campos customizados do ActiveCampaign.
 * Use este endpoint para descobrir os IDs dos campos de UTM.
 * Em seguida, configure as variáveis de ambiente:
 *   AC_UTM_CAMPAIGN_FIELD_ID=<id>
 *   AC_UTM_SOURCE_FIELD_ID=<id>
 *   AC_UTM_MEDIUM_FIELD_ID=<id>
 *   AC_UTM_CONTENT_FIELD_ID=<id>
 *   AC_UTM_TERM_FIELD_ID=<id>
 */
export async function GET() {
  try {
    const fields = await activeCampaignClient.getCustomFields()
    return NextResponse.json({
      success: true,
      total: fields.length,
      fields,
      configured: {
        utm_campaign: process.env.AC_UTM_CAMPAIGN_FIELD_ID || null,
        utm_source:   process.env.AC_UTM_SOURCE_FIELD_ID   || null,
        utm_medium:   process.env.AC_UTM_MEDIUM_FIELD_ID   || null,
        utm_content:  process.env.AC_UTM_CONTENT_FIELD_ID  || null,
        utm_term:     process.env.AC_UTM_TERM_FIELD_ID     || null,
      }
    })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
