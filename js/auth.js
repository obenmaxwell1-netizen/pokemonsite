// ===== AUTH UTILITY =====
async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function updateNavAuth() {
  const area = document.getElementById('nav-auth-area');
  if (!area) return;
  const user = await getCurrentUser();
  if (user) {
    area.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.75rem;">
        <a href="my-inquiries.html" class="btn btn-outline btn-sm">My Inquiries</a>
        <button onclick="signOut()" class="btn btn-outline btn-sm"><i class="fa fa-sign-out-alt"></i></button>
      </div>`;
  } else {
    area.innerHTML = `<a href="auth.html" class="btn btn-primary btn-sm"><i class="fa fa-user"></i> Login</a>`;
  }
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', updateNavAuth);
