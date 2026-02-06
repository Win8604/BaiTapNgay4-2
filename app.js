// Products Dashboard JS
const API = 'https://api.escuelajs.co/api/v1/products';
let products = [];
let filtered = [];
let currentPage = 1;
let pageSize = 10;
let sortField = null;
let sortDir = 1; // 1 asc, -1 desc

// Elements
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('search');
const pageSizeSelect = document.getElementById('pageSize');
const pagination = document.getElementById('pagination');
const infoText = document.getElementById('infoText');
const exportBtn = document.getElementById('exportBtn');
const sortTitleBtn = document.getElementById('sortTitle');
const sortPriceBtn = document.getElementById('sortPrice');

// Modals and forms
const viewModalEl = document.getElementById('viewModal');
const viewModal = new bootstrap.Modal(viewModalEl);
const editForm = document.getElementById('editForm');
const saveEdit = document.getElementById('saveEdit');
const createModalEl = document.getElementById('createModal');
const createModal = new bootstrap.Modal(createModalEl);

// UI helpers
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

const confirmModalEl = document.getElementById('confirmModal');
const confirmModal = new bootstrap.Modal(confirmModalEl);
const confirmOkBtn = document.getElementById('confirmOk');
const confirmCancelBtn = document.getElementById('confirmCancel');

// Create form elements & validation
const createFormEl = document.getElementById('createForm');
const createTitleEl = document.getElementById('createTitle');
const createPriceEl = document.getElementById('createPrice');
const saveCreate = document.getElementById('saveCreate');

function updateCreateButtonState(){
  const titleOk = createTitleEl && createTitleEl.value.trim() !== '';
  const priceVal = createPriceEl && createPriceEl.value !== '' && !isNaN(Number(createPriceEl.value));
  const priceOk = priceVal && Number(createPriceEl.value) >= 0;
  saveCreate.disabled = !(titleOk && priceOk);
}

// enable validation checks on input
if(createTitleEl) createTitleEl.addEventListener('input', ()=>{ createFormEl.classList.remove('was-validated'); updateCreateButtonState(); });
if(createPriceEl) createPriceEl.addEventListener('input', ()=>{ createFormEl.classList.remove('was-validated'); updateCreateButtonState(); });

// reset on modal hide/show
createModalEl.addEventListener('show.bs.modal', ()=>{ if(createFormEl) { createFormEl.reset(); createFormEl.classList.remove('was-validated'); updateCreateButtonState(); } });
createModalEl.addEventListener('shown.bs.modal', ()=>{ if(createTitleEl) createTitleEl.focus(); });
createModalEl.addEventListener('shown.bs.modal', ()=>{ if(createTitleEl) createTitleEl.focus(); });
createModalEl.addEventListener('hidden.bs.modal', ()=>{ if(createFormEl) { createFormEl.reset(); createFormEl.classList.remove('was-validated'); updateCreateButtonState(); } });

async function fetchProducts(){
  showLoading(true);
  try{
    const res = await fetch(API);
    products = await res.json();
    filtered = products.slice();
    renderTable();
  }catch(e){
    showToast('Không thể tải dữ liệu: '+e.message, 'danger');
  }finally{
    showLoading(false);
  }
}

function applyFilters(){
  const q = searchInput.value.trim().toLowerCase();
  filtered = products.filter(p => p.title.toLowerCase().includes(q));
  if(sortField){
    filtered.sort((a,b)=>{
      let va = a[sortField];
      let vb = b[sortField];
      if(typeof va === 'string') va = va.toLowerCase();
      if(typeof vb === 'string') vb = vb.toLowerCase();
      if(va < vb) return -1*sortDir;
      if(va > vb) return 1*sortDir;
      return 0;
    });
  }
}

function renderTable(){
  applyFilters();
  pageSize = parseInt(pageSizeSelect.value,10);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total/pageSize));
  if(currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage-1)*pageSize;
  const pageItems = filtered.slice(start, start+pageSize);

  tableBody.innerHTML = '';
  pageItems.forEach(p=>{
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', p.id);
    tr.setAttribute('title', p.description || '');
    tr.setAttribute('data-bs-toggle','tooltip');
    tr.addEventListener('click', ()=> openViewModal(p.id));

    const imgSrc = (p.images && p.images[0]) ? p.images[0] : '';
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${escapeHtml(p.title)}</td>
      <td>${p.price}</td>
      <td>${p.category ? escapeHtml(p.category.name || p.category) : ''}</td>
      <td>${imgSrc ? `<img src="${imgSrc}" class="tbl-img"/>` : ''}</td>
    `;
    tableBody.appendChild(tr);
  });

  // init tooltips for descriptions
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {placement:'top', html:false})
  })

  renderPagination(totalPages);
  infoText.textContent = `Hiển thị ${start+1}-${Math.min(start+pageSize,total)} / ${total}`;
}

function renderPagination(totalPages){
  pagination.innerHTML = '';
  const prev = document.createElement('li');
  prev.className = 'page-item ' + (currentPage === 1 ? 'disabled':'');
  prev.innerHTML = `<a class="page-link" href="#">Previous</a>`;
  prev.addEventListener('click', (e)=>{e.preventDefault(); if(currentPage>1){ currentPage--; renderTable(); }});
  pagination.appendChild(prev);

  for(let i=1;i<=totalPages;i++){
    const li = document.createElement('li');
    li.className = 'page-item ' + (i===currentPage ? 'active':'');
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click',(e)=>{e.preventDefault(); currentPage=i; renderTable();});
    pagination.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = 'page-item ' + (currentPage === totalPages ? 'disabled':'');
  next.innerHTML = `<a class="page-link" href="#">Next</a>`;
  next.addEventListener('click',(e)=>{e.preventDefault(); if(currentPage<totalPages){ currentPage++; renderTable(); }});
  pagination.appendChild(next);
}

function escapeHtml(str){
  if(!str) return '';
  return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
}

function openViewModal(id){
  const p = products.find(x=>x.id==id);
  if(!p) return;
  document.getElementById('viewTitle').textContent = `Item #${p.id}`;
  document.getElementById('editId').value = p.id;
  document.getElementById('editTitle').value = p.title;
  document.getElementById('editPrice').value = p.price;
  document.getElementById('editDescription').value = p.description;
  document.getElementById('editCategoryId').value = p.category ? (p.category.id || '') : '';
  document.getElementById('editImages').value = p.images ? p.images.join(',') : '';
  viewModal.show();
}

async function saveEditHandler(e){
  e.preventDefault();
  const ok = await showConfirm('Bạn có chắc chắn muốn cập nhật item này?');
  if(!ok) return;
  const id = document.getElementById('editId').value;
  const payload = {
    title: document.getElementById('editTitle').value,
    price: Number(document.getElementById('editPrice').value),
    description: document.getElementById('editDescription').value,
    categoryId: Number(document.getElementById('editCategoryId').value) || undefined,
    images: document.getElementById('editImages').value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  showLoading(true);
  try{
    const res = await fetch(`${API}/${id}`, {
      method: 'PUT',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Update failed');
    const updated = await res.json();
    const idx = products.findIndex(p=>p.id==updated.id);
    if(idx>=0) products[idx] = updated;
    renderTable();
    showToast('Cập nhật thành công', 'success');
    setTimeout(()=>{ document.getElementById('viewAlert').innerHTML=''; viewModal.hide(); }, 800);
  }catch(err){
    showToast('Lỗi khi cập nhật: '+err.message, 'danger');
    showAlert('Lỗi khi cập nhật: '+err.message, 'danger', 'viewAlert');
  }finally{
    showLoading(false);
  }
}

async function saveCreateHandler(e){
  e.preventDefault();
  // form validation
  if(createFormEl && !createFormEl.checkValidity()){
    createFormEl.classList.add('was-validated');
    updateCreateButtonState();
    return;
  }

  const ok = await showConfirm('Tạo item mới?');
  if(!ok) return;
  const payload = {
    title: document.getElementById('createTitle').value,
    price: Number(document.getElementById('createPrice').value),
    description: document.getElementById('createDescription').value,
    categoryId: Number(document.getElementById('createCategoryId').value) || 1,
    images: document.getElementById('createImages').value.split(',').map(s=>s.trim()).filter(Boolean)
  };
  showLoading(true);
  try{
    const res = await fetch(API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if(!res.ok) throw new Error('Create failed');
    const created = await res.json();
    products.unshift(created);
    renderTable();
    showToast('Tạo item thành công', 'success');
    createFormEl.reset();
    createFormEl.classList.remove('was-validated');
    updateCreateButtonState();
    setTimeout(()=>{ document.getElementById('createAlert').innerHTML=''; createModal.hide(); }, 800);
  }catch(err){
    showToast('Lỗi khi tạo: '+err.message, 'danger');
    showAlert('Lỗi khi tạo: '+err.message, 'danger', 'createAlert');
  }finally{
    showLoading(false);
  }
}

function showAlert(msg, type='info', containerId=null){
  const html = `<div class="alert alert-${type} alert-dismissible">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
  if(containerId){
    document.getElementById(containerId).innerHTML = html;
  }else{
    const d = document.createElement('div'); d.innerHTML = html;
    document.body.prepend(d.firstElementChild);
  }
}

function exportCSV(){
  // export current visible rows
  applyFilters();
  const start = (currentPage-1)*pageSize;
  const pageItems = filtered.slice(start, start+pageSize);
  const headers = ['id','title','price','category','images','description'];
  const rows = pageItems.map(p=>[
    p.id,
    `"${(p.title||'').replace(/"/g,'""')}"`,
    p.price,
    p.category ? (p.category.name || p.category) : '',
    `"${(p.images||[]).join(';').replace(/"/g,'""')}"`,
    `"${(p.description||'').replace(/"/g,'""')}"`
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `products_page${currentPage}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  showToast('Đã export CSV của trang hiện tại', 'success');
}

// Events
searchInput.addEventListener('input', ()=>{ currentPage=1; renderTable(); });
pageSizeSelect.addEventListener('change', ()=>{ currentPage=1; renderTable(); });
exportBtn.addEventListener('click', exportCSV);
sortTitleBtn.addEventListener('click', ()=>{ if(sortField==='title') sortDir*=-1; else { sortField='title'; sortDir=1;} renderTable();});
sortPriceBtn.addEventListener('click', ()=>{ if(sortField==='price') sortDir*=-1; else { sortField='price'; sortDir=1;} renderTable();});
saveEdit.addEventListener('click', saveEditHandler);
// wire create form submit (use submit to allow Enter key)
if(createFormEl){
  createFormEl.addEventListener('submit', saveCreateHandler);
} else {
  saveCreate.addEventListener('click', saveCreateHandler);
}

// init
fetchProducts();