"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

function t(fd:FormData,k:string){const v=fd.get(k);return typeof v==='string'?v.trim():''}
function b(fd:FormData,k:string){return fd.get(k)==='on'||fd.get(k)==='true'}
function n(fd:FormData,k:string,d=0){const v=Number(t(fd,k));return Number.isFinite(v)?v:d}
function nullable(v:string){return v||null}
function go(path:string,kind:'saved'|'error',message:string):never{redirect(`${path}?${new URLSearchParams({[kind]:message})}`)}
async function admin(){const user=await requireRole('admin');const supabase=await createClient();return{user,supabase}}
function refresh(){revalidatePath('/');revalidatePath('/admin/content/news');revalidatePath('/admin/content/events');revalidatePath('/admin/content/statistics');revalidatePath('/admin/content/links')}

export async function saveNewsAction(fd:FormData){const path='/admin/content/news';try{const {user,supabase}=await admin();const id=t(fd,'id');const row={title:t(fd,'title'),summary:t(fd,'summary'),content:t(fd,'content'),external_url:nullable(t(fd,'externalUrl')),published_at:t(fd,'publishedAt')||new Date().toISOString(),expires_at:nullable(t(fd,'expiresAt')),is_pinned:b(fd,'isPinned'),is_visible:b(fd,'isVisible'),display_order:n(fd,'displayOrder',100),updated_by:user.id};if(!row.title)throw new Error('กรุณาระบุหัวข้อข่าว');const q=id?supabase.from('site_news_items').update(row).eq('id',id):supabase.from('site_news_items').insert(row);const {error}=await q;if(error)throw error;refresh();}catch(e){go(path,'error',e instanceof Error?e.message:'บันทึกข่าวไม่สำเร็จ')}go(path,'saved','บันทึกข่าวเรียบร้อยแล้ว')}
export async function deleteNewsAction(fd:FormData){return del(fd,'site_news_items','/admin/content/news','ลบข่าวแล้ว')}

export async function saveEventAction(fd:FormData){const path='/admin/content/events';try{const {user,supabase}=await admin();const id=t(fd,'id');const row={title:t(fd,'title'),description:t(fd,'description'),location:t(fd,'location'),start_at:t(fd,'startAt'),end_at:nullable(t(fd,'endAt')),registration_url:nullable(t(fd,'registrationUrl')),accent_color:t(fd,'accentColor')||'#2563eb',is_visible:b(fd,'isVisible'),display_order:n(fd,'displayOrder',100),updated_by:user.id};if(!row.title||!row.start_at)throw new Error('กรุณาระบุชื่อและเวลาเริ่มกิจกรรม');const q=id?supabase.from('site_events').update(row).eq('id',id):supabase.from('site_events').insert(row);const {error}=await q;if(error)throw error;refresh();}catch(e){go(path,'error',e instanceof Error?e.message:'บันทึกกิจกรรมไม่สำเร็จ')}go(path,'saved','บันทึกกิจกรรมเรียบร้อยแล้ว')}
export async function deleteEventAction(fd:FormData){return del(fd,'site_events','/admin/content/events','ลบกิจกรรมแล้ว')}

export async function saveStatAction(fd:FormData){const path='/admin/content/statistics';try{const {user,supabase}=await admin();const id=t(fd,'id');const row={stat_key:t(fd,'statKey'),label:t(fd,'label'),value_mode:t(fd,'valueMode'),manual_value:n(fd,'manualValue'),suffix:t(fd,'suffix'),icon_name:t(fd,'iconName')||'chart',is_visible:b(fd,'isVisible'),display_order:n(fd,'displayOrder',100),updated_by:user.id};if(!row.stat_key||!row.label)throw new Error('กรุณาระบุคีย์และชื่อสถิติ');const q=id?supabase.from('site_stat_items').update(row).eq('id',id):supabase.from('site_stat_items').insert(row);const {error}=await q;if(error)throw error;refresh();}catch(e){go(path,'error',e instanceof Error?e.message:'บันทึกสถิติไม่สำเร็จ')}go(path,'saved','บันทึกสถิติเรียบร้อยแล้ว')}
export async function deleteStatAction(fd:FormData){return del(fd,'site_stat_items','/admin/content/statistics','ลบสถิติแล้ว')}

export async function saveRelatedLinkAction(fd:FormData){const path='/admin/content/links';try{const {user,supabase}=await admin();const id=t(fd,'id');const row={title:t(fd,'title'),description:t(fd,'description'),url:t(fd,'url'),icon_name:t(fd,'iconName')||'link',open_new_tab:b(fd,'openNewTab'),is_visible:b(fd,'isVisible'),display_order:n(fd,'displayOrder',100),updated_by:user.id};if(!row.title||!row.url)throw new Error('กรุณาระบุชื่อและ URL');const q=id?supabase.from('site_related_links').update(row).eq('id',id):supabase.from('site_related_links').insert(row);const {error}=await q;if(error)throw error;refresh();}catch(e){go(path,'error',e instanceof Error?e.message:'บันทึกลิงก์ไม่สำเร็จ')}go(path,'saved','บันทึกลิงก์เรียบร้อยแล้ว')}
export async function deleteRelatedLinkAction(fd:FormData){return del(fd,'site_related_links','/admin/content/links','ลบลิงก์แล้ว')}

async function del(fd:FormData,table:string,path:string,message:string):Promise<never>{try{const {supabase}=await admin();const {error}=await supabase.from(table).delete().eq('id',t(fd,'id'));if(error)throw error;refresh();}catch(e){go(path,'error',e instanceof Error?e.message:'ลบข้อมูลไม่สำเร็จ')}go(path,'saved',message)}
