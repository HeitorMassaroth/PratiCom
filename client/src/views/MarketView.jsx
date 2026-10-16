import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, ShoppingCart, Trash2, QrCode, CreditCard, Receipt, Copy, Check, Sparkles } from 'lucide-react';
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

  const [prodForm, setProdForm] = useState({ name: '', category: 'Snacks', price: '', stock_quantity: '10' });

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
      showToast('Produto sem estoque no momento.', 'error');
      return;
    }
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        showToast('Limite máximo de estoque atingido.', 'error');
        return;
      }
      setCart(cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast(`+1 ${product.name} no carrinho!`);
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

  const totalCart = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        payment_method: paymentMethod,
        items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity }))
      };
      await api.post('/market/checkout', payload);
      showToast('🎉 Pagamento confirmado com sucesso! Obrigado pela compra.');
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
      setProdForm({ name: '', category: 'Snacks', price: '', stock_quantity: '10' });
      showToast('Produto adicionado ao catálogo com sucesso!');
      loadProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    showToast('Código PIX Copia e Cola copiado para a área de transferência!');
    setTimeout(() => setPixCopied(false), 3000);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory === 'Todos') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mercadinho Autônomo & PDV (Honest Market)</h1>
          <p>Terminal 24/7 com autoatendimento, leitor de código de barras e checkout inteligente.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewProdOpen(true)}>
          <Plus size={18} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      {/* Categorias Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px' }}>
        {/* Catálogo */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '18px' }}>
          {filteredProducts.map((p) => {
            const isLowStock = p.stock_quantity <= (p.min_stock || 5);
            return (
              <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span className="badge badge-info">{p.category}</span>
                    {isLowStock && <span className="badge badge-warning">Estoque Baixo</span>}
                  </div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '8px', fontWeight: 700 }}>{p.name}</h3>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                    R$ {Number(p.price).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Disponível: <strong style={{ color: p.stock_quantity > 0 ? 'var(--text-main)' : 'var(--danger)' }}>{p.stock_quantity} un.</strong>
                  </div>
                </div>

                <button
                  className={`btn ${p.stock_quantity > 0 ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', marginTop: '18px', justifyContent: 'center' }}
                  onClick={() => addToCart(p)}
                  disabled={p.stock_quantity <= 0}
                >
                  <ShoppingCart size={16} />
                  <span>{p.stock_quantity > 0 ? 'Adicionar à Cesta' : 'Esgotado'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Carrinho PDV */}
        <div className="glass-card" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.2rem' }}>
            <ShoppingCart size={22} color="var(--primary)" />
            <span>Cesta de Compras</span>
          </h3>

          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <Sparkles size={28} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '0.92rem' }}>Seu carrinho está vazio.</p>
              <small>Adicione itens do catálogo ao lado para simular o autoatendimento.</small>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '18px', paddingRight: '4px' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <small style={{ color: 'var(--text-muted)' }}>R$ {Number(item.price).toFixed(2)} un.</small>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span style={{ fontWeight: 700, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => updateQuantity(item.id, 1)}>+</button>
                      <button className="btn-icon" style={{ width: 26, height: 26, marginLeft: '4px' }} onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total a Pagar:</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
                  R$ {totalCart.toFixed(2)}
                </span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={() => setIsCheckoutOpen(true)}>
                <span>Ir para Pagamento</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Checkout com QR Code PIX */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Concluir Compra no PDV">
        <form onSubmit={handleCheckout}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div style={{ textAlign: 'center', padding: '18px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total da Compra</div>
            <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-heading)' }}>
              R$ {totalCart.toFixed(2)}
            </div>
          </div>

          <div className="form-group">
            <label>Forma de Pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${paymentMethod === 'PIX' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.85rem' }}
                onClick={() => setPaymentMethod('PIX')}
              >
                <QrCode size={22} />
                <span>PIX</span>
              </button>
              <button
                type="button"
                className={`btn ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.85rem' }}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={22} />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                className={`btn ${paymentMethod === 'CONDO_FEE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.85rem' }}
                onClick={() => setPaymentMethod('CONDO_FEE')}
              >
                <Receipt size={22} />
                <span>Boleto Condo</span>
              </button>
            </div>
          </div>

          {/* Experiência PIX Dinâmica */}
          {paymentMethod === 'PIX' && (
            <div style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ width: 140, height: 140, margin: '0 auto 12px', background: '#fff', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* QR Code SVG Visual */}
                <svg viewBox="0 0 100 100" width="100%" height="100%">
                  <rect width="100" height="100" fill="#ffffff" />
                  <rect x="10" y="10" width="30" height="30" fill="#000000" />
                  <rect x="15" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="20" width="10" height="10" fill="#000000" />
                  <rect x="60" y="10" width="30" height="30" fill="#000000" />
                  <rect x="65" y="15" width="20" height="20" fill="#ffffff" />
                  <rect x="70" y="20" width="10" height="10" fill="#000000" />
                  <rect x="10" y="60" width="30" height="30" fill="#000000" />
                  <rect x="15" y="65" width="20" height="20" fill="#ffffff" />
                  <rect x="20" y="70" width="10" height="10" fill="#000000" />
                  <rect x="45" y="20" width="10" height="10" fill="#000000" />
                  <rect x="50" y="45" width="15" height="15" fill="#000000" />
                  <rect x="70" y="70" width="20" height="20" fill="#000000" />
                </svg>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Aponte o app do seu banco para o QR Code acima ou use o Copia e Cola:
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 14px', margin: '0 auto' }}
                onClick={handleCopyPix}
              >
                {pixCopied ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                <span>{pixCopied ? 'Código Copiado!' : 'Copiar Código PIX'}</span>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCheckoutOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-success" style={{ padding: '12px 24px' }}>
              Confirmar Pagamento
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Produto */}
      <Modal isOpen={isNewProdOpen} onClose={() => setIsNewProdOpen(false)} title="Cadastrar Produto no Mercadinho">
        <form onSubmit={handleCreateProduct}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div className="form-group">
            <label>Nome do Produto *</label>
            <input
              type="text"
              className="form-control"
              placeholder="Ex: Suco de Uva Integral 1.5L"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-control" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
                {categories.filter((c) => c !== 'Todos').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Preço de Venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-control"
                placeholder="5.00"
                value={prodForm.price}
                onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Estoque Inicial</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={prodForm.stock_quantity}
              onChange={(e) => setProdForm({ ...prodForm, stock_quantity: e.target.value })}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewProdOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar Produto</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
