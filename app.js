(function(){
  var plans=[].slice.call(document.querySelectorAll('.plan'));
  var selectedLabels=[].slice.call(document.querySelectorAll('.selected-plan'));
  var prices=[].slice.call(document.querySelectorAll('.price'));
  var note=document.querySelector('[data-price-note]');
  var toast=document.querySelector('.toast');
  var mobileBuy=document.querySelector('.mobile-buy');
  function yen(value){return value ? '¥'+Number(value).toLocaleString('ja-JP') : '価格未設定';}
  function select(plan){
    plans.forEach(function(item){var active=item===plan;item.classList.toggle('is-selected',active);item.setAttribute('aria-checked',active?'true':'false');});
    selectedLabels.forEach(function(item){item.textContent=plan.dataset.plan;});
    prices.forEach(function(item){item.textContent=yen(plan.dataset.price);});
    note.textContent=plan.dataset.price?'決済後すぐにQRコードをメールでお送りします。':'このプランの価格は商品データ連携後に表示されます。';
  }
  plans.forEach(function(plan){plan.addEventListener('click',function(){select(plan);});});
  if(mobileBuy){
    var hero=document.querySelector('.hero');
    if('IntersectionObserver' in window && hero){
      new IntersectionObserver(function(entries){mobileBuy.classList.toggle('is-visible',!entries[0].isIntersecting);},{threshold:0}).observe(hero);
    }else{mobileBuy.classList.add('is-visible');}
  }
  document.querySelectorAll('[data-buy]').forEach(function(button){button.addEventListener('click',function(){var selected=document.querySelector('.plan.is-selected');if(!selected)return;var params=new URLSearchParams({plan:selected.dataset.plan,price:selected.dataset.price||'',variant:selected.dataset.variant||''});window.location.href='checkout.html?'+params.toString();});});
})();
