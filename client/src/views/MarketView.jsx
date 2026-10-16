import React, { useState, useEffect } from 'react';
import { ShoppingBag, Plus, ShoppingCart, Trash2, QrCode, CreditCard, Receipt } from 'lucide-react';
import api from '../services/api';
import Modal from '../components/Modal';

export default function MarketView() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isNewProdOpen, setIsNewProdOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [errorMsg, setErrorMsg] = useState('');

  const [prodForm, setProdForm] = useState({ name: '', category: 'Snacks', price: '', stock_quantity: '10' });

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
      alert('Produto sem estoque disponível no momento.');
      return;
    }
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        alert('Limite máximo de estoque atingido.');
        return;
      }
      setCart(cart.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((i) => i.id !== productId));
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
      alert('🎉 Compra realizada com sucesso no Mercadinho!');
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
      loadProducts();
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Mercadinho Autônomo (Honest Market & PDV)</h1>
          <p>Terminal de autoatendimento 24/7 com controle em tempo real de estoque e pagamentos.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsNewProdOpen(true)}>
          <Plus size={18} />
          <span>Cadastrar Produto</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Catálogo de Produtos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {products.map((p) => {
            const isLowStock = p.stock_quantity <= (p.min_stock || 5);
            return (
              <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge badge-info">{p.category}</span>
                    {isLowStock && <span className="badge badge-warning">Estoque Baixo</span>}
                  </div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '6px' }}>{p.name}</h3>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                    R$ {Number(p.price).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Estoque: <strong>{p.stock_quantity} un.</strong>
                  </div>
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
                  onClick={() => addToCart(p)}
                  disabled={p.stock_quantity <= 0}
                >
                  <ShoppingCart size={16} />
                  <span>{p.stock_quantity > 0 ? 'Adicionar' : 'Esgotado'}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Carrinho PDV */}
        <div className="glass-card" style={{ height: 'fit-content', position: 'sticky', top: '100px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} color="var(--primary)" />
            <span>Ponto de Venda (PDV)</span>
          </h3>

          {cart.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
              Seu carrinho está vazio. Selecione itens do catálogo ao lado.
            </p>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto', marginBottom: '16px' }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</div>
                      <small style={{ color: 'var(--text-muted)' }}>{item.quantity}x R$ {Number(item.price).toFixed(2)}</small>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </span>
                      <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => removeFromCart(item.id)}>
                        <Trash2 size={13} color="var(--danger)" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '2px solid var(--border)', paddingTop: '14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>Total a Pagar:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                  R$ {totalCart.toFixed(2)}
                </span>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setIsCheckoutOpen(true)}>
                <span>Finalizar Compra</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Checkout */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Concluir Pagamento no Autoatendimento">
        <form onSubmit={handleCheckout}>
          {errorMsg && <div className="badge badge-danger" style={{ marginBottom: 16, width: '100%' }}>{errorMsg}</div>}
          <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Valor Total da Compra</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>R$ {totalCart.toFixed(2)}</div>
          </div>

          <div className="form-group">
            <label>Forma de Pagamento</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${paymentMethod === 'PIX' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.8rem' }}
                onClick={() => setPaymentMethod('PIX')}
              >
                <QrCode size={20} />
                <span>PIX</span>
              </button>
              <button
                type="button"
                className={`btn ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.8rem' }}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={20} />
                <span>Cartão</span>
              </button>
              <button
                type="button"
                className={`btn ${paymentMethod === 'CONDO_FEE' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flexDirection: 'column', padding: '12px', fontSize: '0.8rem' }}
                onClick={() => setPaymentMethod('CONDO_FEE')}
              >
                <Receipt size={20} />
                <span>Boleto Condo</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsCheckoutOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-success">Confirmar Pagamento</button>
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
              placeholder="Ex: Suco de Laranja 1L"
              value={prodForm.name}
              onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label>Categoria</label>
              <select className="form-control" value={prodForm.category} onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}>
                <option value="Bebidas">Bebidas</option>
                <option value="Snacks">Snacks</option>
                <option value="Doces">Doces</option>
                <option value="Congelados">Congelados</option>
                <option value="Higiene">Higiene</option>
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
