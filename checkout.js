(function(){
  var query=new URLSearchParams(window.location.search);
  var plan=query.get('plan')||'7日間 50GB';
  var price=query.get('price');
  var planEl=document.getElementById('summary-plan');
  var planSideEl=document.getElementById('summary-plan-side');
  var priceEl=document.getElementById('summary-price');
  var totalEl=document.getElementById('summary-total');
  var specEl=document.getElementById('summary-spec');
  var dateInput=document.getElementById('departure-date');
  var form=document.getElementById('checkout-form');
  var message=document.getElementById('checkout-message');
  planEl.textContent=plan;
  if(planSideEl) planSideEl.textContent=plan;
  var formattedPrice=price?'¥'+Number(price).toLocaleString('ja-JP'):'価格確認中';
  priceEl.textContent=formattedPrice;
  if(totalEl) totalEl.textContent=formattedPrice;
  if(specEl){
    var specMatch=plan.match(/(\d+)日間?\s*(\d+)GB/);
    specEl.textContent=specMatch?specMatch[2]+'GB / '+specMatch[1]+'日間':'プラン内容をご確認ください';
  }
  var today=new Date();
  var yyyy=today.getFullYear();
  var mm=String(today.getMonth()+1).padStart(2,'0');
  var dd=String(today.getDate()).padStart(2,'0');
  dateInput.min=yyyy+'-'+mm+'-'+dd;
  form.addEventListener('submit',function(event){
    event.preventDefault();
    if(!form.checkValidity()){form.reportValidity();return;}
    message.textContent='お申し込み内容を確認しました。決済機能との接続準備中です。';
    message.classList.add('is-visible');
  });
})();
