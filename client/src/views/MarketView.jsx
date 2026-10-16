import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, ShoppingCart, Trash2, QrCode, CreditCard, Receipt, Copy, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';
import { showToast } from '../components/Toast';

export default function MarketView() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [pixCopied, setPixCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [prodForm, setProdForm] = useState({ name: '', category: 'Snacks', price: '', stock_quantity: '10', min_stock: '5' });

  const categories = ['Todos', 'Bebidas', 'Snacks', 'Doces', 'Congelados', 'Higiene'];

  const loadProducts = () => {
    api.get('/market/products')
      .then((data) => setProducts(data || []))
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener('condo-changed', loadProducts);
    return () => window.removeEventListener('condo-changed', loadProducts);
  }, []);

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showToast('Produto indisponível no estoque.', 'error');
      return;
    }
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        showToast('Quantidade máxima em estoque atingida.', 'error');
        return;
      }
      setCart(cart.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`Adicionado: ${product.name}`);
  };

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQ = i.quantity + delta;
            return newQ > 0 ? { ...i, quantity: newQ } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.id !== productId));
    showToast('Item removido do carrinho.', 'info');
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        payment_method: paymentMethod,
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity }))
      };
      await api.post('/market/checkout', payload);
      showToast('Transação PDV concluída e estoque baixado.');
      setCart([]);
      setIsCheckoutOpen(false);
      loadProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      await api.post('/market/products', prodForm);
      setIsNewProdOpen(false);
      setProdForm({ name: '', category: 'Snacks', price: '', stock_quantity: '10', min_stock: '5' });
      showToast('Produto catalogado com sucesso.');
      loadProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    showToast('Chave PIX copiada para a área de transferência.');
    setTimeout(() => setPixCopied(false), 2500);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'Todos') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mercadinho Autônomo & Terminal PDV</h1>
          <p>Gestão de inventário 24/7, reposição de estoque e checkout de autoatendimento via PIX.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewProdOpen(true)}>
          <Plus size={16} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Categorias Segmentadas */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <div className="segmented-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`segmented-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {cart.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={() => setIsCheckoutOpen(true)}
            style={{ gap: '8px' }}
          >
            <ShoppingCart size={16} />
            <span>Ver Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)} itens • R$ {Number(totalCart).toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</span>
          </button>
        )}
      </div>

      {/* Grid Principal: Catálogo de Produtos e Carrinho Lateral */}
      <div style={{ display: 'grid', gridTemplateColumns: cart.length > 0 ? '1fr 340px' : '1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Catálogo de Produtos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {filteredProducts.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
              Nenhum produto cadastrado nesta categoria.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const isLowStock = p.stock_quantity <= p.min_stock;
              const isOutOfStock = p.stock_quantity <= 0;
              return (
                <div
                  key={p.id}
                  className="erp-panel"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    borderColor: isOutOfStock ? 'var(--border)' : 'var(--border)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>{p.category}</span>
                      {isOutOfStock ? (
                        <span className="badge badge-danger">Esgotado</span>
                      ) : isLowStock ? (
                        <span className="badge badge-warning">{p.stock_quantity} un</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{p.stock_quantity} un</span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 600, marginBottom: '6px', lineHeight: '1.3' }}>{p.name}</h3>
                  </div>

                  <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div className="num-cell" style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <button
                      className="btn btn-sm btn-secondary"
                      disabled={isOutOfStock}
                      onClick={() => addToCart(p)}
                      title={isOutOfStock ? 'Produto sem estoque' : 'Adicionar ao carrinho'}
                    >
                      <Plus size={14} />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Carrinho Lateral Fixo */}
        {cart.length > 0 && (
          <div className="erp-panel" style={{ position: 'sticky', top: '80px' }}>
            <div className="panel-header">
              <h3>
                <ShoppingCart size={18} color="var(--primary)" />
                <span>Carrinho de Compras</span>
              </h3>
              <button
                className="btn-icon"
                style={{ width: 26, height: 26 }}
                onClick={() => setCart([])}
                title="Limpar carrinho"
              >
                <Trash2 size={13} color="var(--danger)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.86rem'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, paddingRight: '8px' }}>
                    <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div className="num-cell" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      R$ {Number(item.price).toFixed(2)} un
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="btn-icon"
                      style={{ width: 24, height: 24, fontSize: '0.8rem' }}
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </button>
                    <span className="num-cell" style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn-icon"
                      style={{ width: 24, height: 24, fontSize: '0.8rem' }}
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subtotal:</span>
                <span className="num-cell" style={{ fontWeight: 600 }}>R$ {Number(totalCart).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>Total a Pagar:</span>
                <span className="num-cell" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
                  R$ {Number(totalCart).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '0.92rem' }}
              onClick={() => setIsCheckoutOpen(true)}
            >
              <span>Prosseguir para Pagamento</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Finalizar Checkout */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Pagamento & Checkout PDV">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCheckout}>
          <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Itens Selecionados:</span>
              <span className="num-cell" style={{ fontWeight: 600 }}>{cart.reduce((a, b) => a + b.quantity, 0)} unidades</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700 }}>Total da Venda:</span>
              <span className="num-cell" style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--primary)' }}>
                R$ {Number(totalCart).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Forma de Liquidação <span className="required">*</span></label>
            <div className="segmented-tabs" style={{ width: '100%' }}>
              <button
                type="button"
                className={`segmented-tab ${paymentMethod === 'PIX' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setPaymentMethod('PIX')}
              >
                PIX Instantâneo
              </button>
              <button
                type="button"
                className={`segmented-tab ${paymentMethod === 'CARD' ? 'active' : ''}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setPaymentMethod('CARD')}
              >
                Cartão Débito / Crédito
              </button>
            </div>
          </div>

          {paymentMethod === 'PIX' && (
            <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '18px' }}>
              <div style={{ width: '140px', height: '140px', background: '#ffffff', borderRadius: 'var(--radius-sm)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                {/* QR Code SVG Vetorial Limpo */}
                <svg width="120" height="120" viewBox="0 0 100 100">
                  <rect width="100" height="100" fill="#ffffff" />
                  <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#000000" />
                  <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#000000" />
                  <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#000000" />
                  <rect x="50" y="20" width="5" height="15" fill="#000000" />
                  <rect x="55" y="45" width="20" height="10" fill="#000000" />
                  <rect x="20" y="45" width="15" height="10" fill="#000000" />
                  <rect x="65" y="65" width="25" height="25" fill="#000000" />
                  <rect x="70" y="70" width="15" height="15" fill="#ffffff" />
                  <rect x="45" y="65" width="10" height="20" fill="#000000" />
                </svg>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span className="num-cell" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  pix.praticom.erp/transacao-98421
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={handleCopyPix}
                >
                  {pixCopied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                  <span>{pixCopied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Confirmar Pagamento</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Cadastrar Novo Produto */}
      <Modal isOpen={isNewProdOpen} onClose={() => setIsNewProdOpen(false)} title="Cadastrar Produto no Catálogo">
        {errorMsg && (
          <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '14px' }}>
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleCreateProduct}>
          <div className="form-group">
            <label>Nome do Produto <span className="required">*</span></label>
            <input
              type="text"
              className="form-control"
              required
              placeholder="Ex: Coca-Cola Lata 350ml, Barra de Cereal"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Departamento / Categoria <span className="required">*</span></label>
              <select
                className="form-control"
                value={prodForm.category}
                onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
              >
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks">Snacks</option>
                <option value="Doces">Doces</option>
                <option value="Congelados">Congelados</option>
                <option value="Higiene">Higiene</option>
                <option value="Geral">Geral</option>
              </select>
            </div>
            <div className="form-group">
              <label>Preço Unitário (R$) <span className="required">*</span></label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                required
                placeholder="0.00"
                value={prodForm.price}
                onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label>Estoque Físico Inicial <span className="required">*</span></label>
              <input
                type="number"
                min="0"
                className="form-control"
                required
                value={prodForm.stock_quantity}
                onChange={(e) => setProdForm({ ...prodForm, stock_quantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Estoque Mínimo de Alerta</label>
              <input
                type="number"
                min="1"
                className="form-control"
                value={prodForm.min_stock}
                onChange={(e) => setProdForm({ ...prodForm, min_stock: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewProdOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Check size={16} />
              <span>Incluir no Catálogo</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
