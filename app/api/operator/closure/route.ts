import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
try {
const token = (await cookies()).get("turnero_session")?.value;
if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
const body = await request.json();
const turnId = String(body?.turnId ?? "");
if (!turnId) return Response.json({ ok:false, error:"Turno requerido" }, { status:400 });

const data = await supabaseRpc("api_save_turn_closure", {
p_token: token,
p_turn_id: turnId,
p_career_interest: body?.careerInterest ? String(body.careerInterest) : null,
p_residence_interest: typeof body?.residenceInterest === "boolean" ? body.residenceInterest : null,
p_scholarship_interest: typeof body?.scholarshipInterest === "boolean" ? body.scholarshipInterest : null,
p_operator_comment: body?.operatorComment ? String(body.operatorComment) : null,
p_academic_program_id: body?.academicProgramId ? String(body.academicProgramId) : null,
});
return Response.json({ ok:true, data });
} catch (error) {
return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo guardar el cierre" }, { status:400 });
}
}
