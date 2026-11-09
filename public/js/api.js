let csrf=null;
export const setCsrf=(v)=>{csrf=v;};
export async function request(url,{method='GET',body=null,binary=false}={}){
  const headers={};
  if(method!=='GET')headers['X-CSRF-Token']=csrf||'';
  if(body!=null)headers['Content-Type']=binary?(body.type||'application/octet-stream'):'application/json';
  let resp;
  try{resp=await fetch(url,{method,headers,body:body==null?undefined:binary?body:JSON.stringify(body),credentials:'same-origin'});}
  catch{throw Error('Сервер недоступен. Проверь запуск приложения.');}
  const data=await resp.json().catch(()=>({error:'Непредвиденный ответ сервера'}));
  if(!resp.ok)throw Error(data.error||`Ошибка ${resp.status}`);
  return data;
}
