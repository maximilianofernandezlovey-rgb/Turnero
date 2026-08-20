export async function GET(){
  return Response.json({ok:true,service:"turnero-uade",timestamp:new Date().toISOString()});
}
