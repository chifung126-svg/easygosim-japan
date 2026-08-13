(function () {
  const form = document.getElementById('delivery-form');
  const status = document.getElementById('form-status');
  if (!form || !status) return;

  const apiUrl = 'https://easygosim-japan-production.up.railway.app/api/activation-request';
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    button.disabled = true;
    status.style.color = '#38526b';
    status.textContent = '送信中です。少々お待ちください。';
    const data = Object.fromEntries(new FormData(form).entries());
    data.source_domain = window.location.hostname;
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || '送信に失敗しました。');
      form.reset();
      status.style.color = '#16794a';
      status.textContent = '送信しました。出発日前にeSIMを準備してご連絡します。';
    } catch (error) {
      status.style.color = '#b42318';
      status.textContent = error.message || '送信に失敗しました。時間をおいて再度お試しください。';
    } finally {
      button.disabled = false;
    }
  });
})();
