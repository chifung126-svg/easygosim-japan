(function(){
  var form=document.getElementById('delivery-form');
  var status=document.getElementById('form-status');
  if(!form||!status)return;
  form.addEventListener('submit',function(event){
    event.preventDefault();
    if(!form.checkValidity()){
      form.reportValidity();
      status.textContent='未入力または入力形式をご確認ください。';
      status.style.color='#b42318';
      return;
    }
    status.style.color='#16794a';
    status.textContent='入力内容を確認しました。送信機能はメールAPI接続後に有効になります。';
  });
})();
