import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, Timestamp, doc, updateDoc, deleteDoc, getDocs, where } from 'firebase/firestore';

// Contexto para compartilhar o estado do Firebase e do usuário
const FirebaseContext = createContext(null);

// Componente principal do aplicativo
const App = () => {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'orders', 'financials', 'customers', 'vehicles'
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');

  // Função para exibir um modal de mensagem
  const showMessageBox = (message) => {
    setModalContent(message);
    setShowModal(true);
  };

  // Inicializa o Firebase e configura o listener de autenticação
  useEffect(() => {
    try {
      const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');

      if (Object.keys(firebaseConfig).length === 0) {
        console.error("Firebase config is missing. Please ensure __firebase_config is provided.");
        showMessageBox("Erro: Configuração do Firebase ausente. O aplicativo pode não funcionar corretamente.");
        return;
      }

      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const authInstance = getAuth(app);

      setDb(firestore);
      setAuth(authInstance);

      // Listener de mudança de estado de autenticação
      const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
        if (user) {
          setUserId(user.uid);
        } else {
          // Se não houver usuário logado, tenta autenticar anonimamente
          try {
            if (typeof __initial_auth_token !== 'undefined') {
              await signInWithCustomToken(authInstance, __initial_auth_token);
            } else {
              await signInAnonymously(authInstance);
            }
            setUserId(authInstance.currentUser?.uid || crypto.randomUUID());
          } catch (error) {
            console.error("Erro ao autenticar no Firebase:", error);
            showMessageBox(`Erro de autenticação: ${error.message}`);
            setUserId(crypto.randomUUID()); // Fallback para ID aleatório
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe(); // Limpa o listener ao desmontar
    } catch (error) {
      console.error("Erro na inicialização do Firebase:", error);
      showMessageBox(`Erro crítico na inicialização: ${error.message}`);
    }
  }, []);

  // Componente Modal para mensagens
  const Modal = ({ message, onClose }) => {
    if (!showModal) return null;
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full text-center">
          <p className="text-lg font-semibold mb-4">{message}</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition duration-150 ease-in-out"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  // Renderiza o aplicativo principal após a autenticação
  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 text-gray-700">
        Carregando aplicativo...
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, auth, userId, showMessageBox }}>
      <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">
        <Modal message={modalContent} onClose={() => setShowModal(false)} />

        {/* Cabeçalho */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 shadow-lg">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center">
            <h1 className="text-3xl font-bold mb-2 sm:mb-0">Gerenciador de Entregas de Água</h1>
            <nav className="flex space-x-4">
              <button
                onClick={() => { setCurrentPage('dashboard'); setSelectedOrder(null); }}
                className={`py-2 px-4 rounded-md transition duration-200 ease-in-out ${currentPage === 'dashboard' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-700'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => { setCurrentPage('orders'); setSelectedOrder(null); }}
                className={`py-2 px-4 rounded-md transition duration-200 ease-in-out ${currentPage === 'orders' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-700'}`}
              >
                Pedidos
              </button>
              <button
                onClick={() => { setCurrentPage('financials'); setSelectedOrder(null); }}
                className={`py-2 px-4 rounded-md transition duration-200 ease-in-out ${currentPage === 'financials' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-700'}`}
              >
                Financeiro
              </button>
              <button
                onClick={() => { setCurrentPage('customers'); setSelectedOrder(null); }}
                className={`py-2 px-4 rounded-md transition duration-200 ease-in-out ${currentPage === 'customers' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-700'}`}
              >
                Clientes
              </button>
              <button
                onClick={() => { setCurrentPage('vehicles'); setSelectedOrder(null); }}
                className={`py-2 px-4 rounded-md transition duration-200 ease-in-out ${currentPage === 'vehicles' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-700'}`}
              >
                Veículos
              </button>
            </nav>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
          {userId && (
            <div className="text-sm text-gray-600 mb-4 text-center">
              ID do Usuário: <span className="font-mono bg-gray-200 px-2 py-1 rounded-md">{userId}</span>
            </div>
          )}

          {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} setSelectedOrder={setSelectedOrder} />}
          {currentPage === 'orders' && (
            <OrderManager
              selectedOrder={selectedOrder}
              setSelectedOrder={setSelectedOrder}
              setCurrentPage={setCurrentPage}
            />
          )}
          {currentPage === 'financials' && <Financials />}
          {currentPage === 'customers' && <CustomerManager />}
          {currentPage === 'vehicles' && <VehicleManager />}
        </main>

        {/* Rodapé */}
        <footer className="bg-gray-800 text-white p-4 text-center text-sm shadow-inner">
          <div className="container mx-auto">
            &copy; {new Date().getFullYear()} Gerenciador de Entregas de Água. Todos os direitos reservados.
          </div>
        </footer>
      </div>
    </FirebaseContext.Provider>
  );
};

// Componente Dashboard
const Dashboard = ({ setCurrentPage, setSelectedOrder }) => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    if (!db || !userId) return;

    // Listener para vendas
    const salesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/sales`);
    const qSales = query(salesCollectionRef, orderBy('timestamp', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
    }, (error) => {
      console.error("Erro ao buscar vendas:", error);
      showMessageBox(`Erro ao carregar vendas: ${error.message}`);
    });

    // Listener para despesas
    const expensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
    const qExpenses = query(expensesCollectionRef, orderBy('timestamp', 'desc'));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    }, (error) => {
      console.error("Erro ao buscar despesas:", error);
      showMessageBox(`Erro ao carregar despesas: ${error.message}`);
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
    };
  }, [db, userId, showMessageBox]);

  const totalSales = sales.reduce((sum, order) => sum + (order.status === 'Entregue' ? order.price : 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSales - totalExpenses;
  const pendingOrdersCount = sales.filter(order => order.status === 'Pendente' || order.status === 'Em Trânsito').length;
  const deliveredOrdersCount = sales.filter(order => order.status === 'Entregue').length;

  const recentOrders = sales.slice(0, 5); // Últimos 5 pedidos

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Card de Resumo de Vendas */}
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Resumo Financeiro</h2>
        <div className="space-y-2">
          <p className="flex justify-between items-center text-lg">
            Total de Vendas: <span className="font-semibold text-green-600">R$ {totalSales.toFixed(2)}</span>
          </p>
          <p className="flex justify-between items-center text-lg">
            Total de Despesas: <span className="font-semibold text-red-600">R$ {totalExpenses.toFixed(2)}</span>
          </p>
          <p className="flex justify-between items-center text-xl font-bold pt-2 border-t border-gray-200">
            Lucro Líquido: <span className={`${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>R$ {netProfit.toFixed(2)}</span>
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('financials')}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200 ease-in-out"
        >
          Ver Detalhes Financeiros
        </button>
      </div>

      {/* Card de Status de Pedidos */}
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Status dos Pedidos</h2>
        <div className="space-y-2">
          <p className="flex justify-between items-center text-lg">
            Pedidos Pendentes/Em Trânsito: <span className="font-semibold text-yellow-600">{pendingOrdersCount}</span>
          </p>
          <p className="flex justify-between items-center text-lg">
            Pedidos Entregues: <span className="font-semibold text-green-600">{deliveredOrdersCount}</span>
          </p>
          <p className="flex justify-between items-center text-xl font-bold pt-2 border-t border-gray-200">
            Total de Pedidos: <span className="text-blue-700">{sales.length}</span>
          </p>
        </div>
        <button
          onClick={() => setCurrentPage('orders')}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200 ease-in-out"
        >
          Ver Todos os Pedidos
        </button>
      </div>

      {/* Card de Últimos Pedidos */}
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 lg:col-span-1 md:col-span-2">
        <h2 className="text-xl font-bold text-blue-700 mb-4">Últimos Pedidos</h2>
        {recentOrders.length > 0 ? (
          <ul className="space-y-3">
            {recentOrders.map(order => (
              <li key={order.id} className="border-b border-gray-200 pb-2 last:border-b-0 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{order.customerName}</p>
                  <p className="text-sm text-gray-600">
                    {order.volumeLiters} L - R$ {order.price.toFixed(2)} - <span className={`font-medium ${order.status === 'Entregue' ? 'text-green-600' : order.status === 'Pendente' ? 'text-yellow-600' : 'text-blue-600'}`}>{order.status}</span>
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    setCurrentPage('orders');
                  }}
                  className="text-blue-500 hover:text-blue-700 text-sm"
                >
                  Ver
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Nenhum pedido recente.</p>
        )}
        <button
          onClick={() => setCurrentPage('orders')}
          className="mt-4 w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200 ease-in-out"
        >
          Adicionar Novo Pedido
        </button>
      </div>
    </div>
  );
};

// Componente para Gerenciamento de Pedidos (Lista e Formulário)
const OrderManager = ({ selectedOrder, setSelectedOrder, setCurrentPage }) => {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  }, [selectedOrder]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Gerenciar Pedidos</h2>
        <button
          onClick={() => { setSelectedOrder(null); setShowForm(!showForm); }}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out flex items-center space-x-2"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Voltar para Lista</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Novo Pedido</span>
            </>
          )}
        </button>
      </div>

      {showForm ? (
        <OrderForm selectedOrder={selectedOrder} setSelectedOrder={setSelectedOrder} setShowForm={setShowForm} />
      ) : (
        <OrderList setSelectedOrder={setSelectedOrder} />
      )}
    </div>
  );
};

// Componente de Formulário de Pedido
const OrderForm = ({ selectedOrder, setSelectedOrder, setShowForm }) => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [volumeLiters, setVolumeLiters] = useState('1000');
  const [price, setPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Dinheiro');
  const [status, setStatus] = useState('Pendente');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehiclePlate, setSelectedVehiclePlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [customersList, setCustomersList] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [vehiclesList, setVehiclesList] = useState([]);

  useEffect(() => {
    if (selectedOrder) {
      setCustomerName(selectedOrder.customerName || '');
      setAddress(selectedOrder.address || '');
      setContact(selectedOrder.contact || '');
      setVolumeLiters(String(selectedOrder.volumeLiters) || '1000');
      setPrice(String(selectedOrder.price) || '');
      setPaymentMethod(selectedOrder.paymentMethod || 'Dinheiro');
      setStatus(selectedOrder.status || 'Pendente');
      setSelectedVehicleId(selectedOrder.vehicleId || '');
      setSelectedVehiclePlate(selectedOrder.vehiclePlate || '');
    } else {
      // Reset form for new order
      setCustomerName('');
      setAddress('');
      setContact('');
      setVolumeLiters('1000');
      setPrice('');
      setPaymentMethod('Dinheiro');
      setStatus('Pendente');
      setSelectedVehicleId('');
      setSelectedVehiclePlate('');
    }
  }, [selectedOrder]);

  // Fetch customers for autocomplete
  useEffect(() => {
    if (!db || !userId) return;

    const customersCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/customers`);
    const unsubscribe = onSnapshot(customersCollectionRef, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomersList(customersData);
    }, (error) => {
      console.error("Erro ao buscar clientes:", error);
      showMessageBox(`Erro ao carregar clientes: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessageBox]);

  // Fetch vehicles for dropdown
  useEffect(() => {
    if (!db || !userId) return;

    const vehiclesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/vehicles`);
    const unsubscribe = onSnapshot(vehiclesCollectionRef, (snapshot) => {
      const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehiclesList(vehiclesData);
    }, (error) => {
      console.error("Erro ao buscar veículos:", error);
      showMessageBox(`Erro ao carregar veículos: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessageBox]);


  // Filter customers based on input
  useEffect(() => {
    if (customerName.length > 0) {
      const filtered = customersList.filter(customer =>
        customer.name.toLowerCase().includes(customerName.toLowerCase())
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(filtered.length > 0);
    } else {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    }
  }, [customerName, customersList]);

  const handleCustomerSelect = (customer) => {
    setCustomerName(customer.name);
    setAddress(customer.address);
    setContact(customer.contact);
    setShowCustomerDropdown(false);
  };

  const handleVehicleSelect = (e) => {
    const selectedId = e.target.value;
    const selectedVehicle = vehiclesList.find(v => v.id === selectedId);
    setSelectedVehicleId(selectedId);
    setSelectedVehiclePlate(selectedVehicle ? selectedVehicle.plate : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }

    setLoading(true);
    try {
      let customerId = null;
      let existingCustomer = customersList.find(c => c.name.toLowerCase() === customerName.toLowerCase());

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // Optionally update existing customer details if they changed in the form
        if (existingCustomer.address !== address || existingCustomer.contact !== contact) {
          const customerDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/customers`, customerId);
          await updateDoc(customerDocRef, { address, contact });
        }
      } else {
        // Add new customer
        const newCustomerData = {
          name: customerName,
          address,
          contact,
          timestamp: Timestamp.now(),
        };
        const docRef = await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/customers`), newCustomerData);
        customerId = docRef.id;
      }

      const orderData = {
        customerId, // Link to customer
        customerName, // Store name directly for historical records/simplicity
        address,
        contact,
        volumeLiters: parseInt(volumeLiters),
        price: parseFloat(price),
        paymentMethod,
        status,
        vehicleId: selectedVehicleId,
        vehiclePlate: selectedVehiclePlate,
        timestamp: Timestamp.now(),
      };

      if (selectedOrder) {
        // Atualiza pedido existente
        const orderDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/sales`, selectedOrder.id);
        await updateDoc(orderDocRef, orderData);
        showMessageBox("Pedido atualizado com sucesso!");
      } else {
        // Adiciona novo pedido
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/sales`), orderData);
        showMessageBox("Pedido adicionado com sucesso!");
      }
      setSelectedOrder(null); // Limpa a seleção após salvar
      setShowForm(false); // Volta para a lista de pedidos
    } catch (error) {
      console.error("Erro ao salvar pedido:", error);
      showMessageBox(`Erro ao salvar pedido: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-gray-50 rounded-lg shadow-inner">
      <h3 className="text-xl font-semibold text-blue-600 mb-4">{selectedOrder ? 'Editar Pedido' : 'Adicionar Novo Pedido'}</h3>
      <div className="relative">
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
        <input
          type="text"
          id="customerName"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          onFocus={() => customerName.length > 0 && setFilteredCustomers(customersList.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())))}
          onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)} // Delay to allow click on dropdown item
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        />
        {showCustomerDropdown && filteredCustomers.length > 0 && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
            {filteredCustomers.map(customer => (
              <li
                key={customer.id}
                onMouseDown={() => handleCustomerSelect(customer)} // Use onMouseDown to prevent onBlur from firing first
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
              >
                {customer.name} ({customer.address})
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
        <input
          type="text"
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        />
      </div>
      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contato</label>
        <input
          type="text"
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="volumeLiters" className="block text-sm font-medium text-gray-700">Volume (Litros)</label>
          <select
            id="volumeLiters"
            value={volumeLiters}
            onChange={(e) => setVolumeLiters(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
          >
            <option value="1000">1.000 L</option>
            <option value="2000">2.000 L</option>
            <option value="3000">3.000 L</option>
            <option value="4000">4.000 L</option>
            <option value="5000">5.000 L</option>
            <option value="6000">6.000 L</option>
            <option value="7000">7.000 L</option>
            <option value="8000">8.000 L</option>
            <option value="9000">9.000 L</option>
            <option value="10000">10.000 L</option>
          </select>
        </div>
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">Preço (R$)</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Método de Pagamento</label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
          >
            <option value="Dinheiro">Dinheiro</option>
            <option value="Cartão">Cartão</option>
            <option value="Pix">Pix</option>
            <option value="Transferência">Transferência</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
          >
            <option value="Pendente">Pendente</option>
            <option value="Em Trânsito">Em Trânsito</option>
            <option value="Entregue">Entregue</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="vehicle" className="block text-sm font-medium text-gray-700">Veículo para Entrega</label>
        <select
          id="vehicle"
          value={selectedVehicleId}
          onChange={handleVehicleSelect}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        >
          <option value="">-- Selecione um Veículo --</option>
          {vehiclesList.map(vehicle => (
            <option key={vehicle.id} value={vehicle.id}>
              {vehicle.plate} - {vehicle.model} ({vehicle.capacity}L)
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => { setSelectedOrder(null); setShowForm(false); }}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Salvando...' : (selectedOrder ? 'Atualizar Pedido' : 'Adicionar Pedido')}
        </button>
      </div>
    </form>
  );
};

// Componente de Lista de Pedidos
const OrderList = ({ setSelectedOrder }) => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!db || !userId) return;

    const salesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/sales`);
    const q = query(salesCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(ordersData);
    }, (error) => {
      console.error("Erro ao buscar pedidos:", error);
      showMessageBox(`Erro ao carregar pedidos: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessageBox]);

  const handleDelete = async (orderId) => {
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    // Implementar um modal de confirmação customizado aqui, pois alert() não é permitido.
    // Por simplicidade, farei a exclusão direta, mas em um app real, adicione um modal.
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este pedido?"); // Temporário, substituir por modal
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/sales`, orderId));
        showMessageBox("Pedido excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir pedido:", error);
        showMessageBox(`Erro ao excluir pedido: ${error.message}`);
      }
    }
  };

  const handleSendWhatsApp = (order) => {
    // Formata a mensagem para o WhatsApp
    const message = `*NOVO PEDIDO DE ÁGUA*\n\n` +
      `*Cliente:* ${order.customerName}\n` +
      `*Endereço:* ${order.address}\n` +
      `*Contato:* ${order.contact}\n` +
      `*Volume:* ${order.volumeLiters} Litros\n` +
      `*Preço:* R$ ${order.price.toFixed(2)}\n` +
      `*Status Atual:* ${order.status}\n` +
      `*Método de Pagamento:* ${order.paymentMethod}\n` +
      (order.vehiclePlate ? `*Veículo:* ${order.vehiclePlate}\n\n` : '\n\n') +
      `*Observação:* Por favor, realize a entrega o mais breve possível.`;

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);

    // Abre o WhatsApp Web com a mensagem pré-preenchida
    // O usuário precisará selecionar o contato ou grupo para enviar a mensagem.
    const whatsappWebUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;
    window.open(whatsappWebUrl, '_blank');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = filterStatus === 'Todos' || order.status === filterStatus;
    const matchesSearch = searchTerm === '' ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contact.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
      <div className="mb-4 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 items-center">
        <input
          type="text"
          placeholder="Buscar por cliente, endereço, contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
        >
          <option value="Todos">Todos os Status</option>
          <option value="Pendente">Pendente</option>
          <option value="Em Trânsito">Em Trânsito</option>
          <option value="Entregue">Entregue</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      {filteredOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-md">Cliente</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-md">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.address}</div>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.volumeLiters} L</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R$ {order.price.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{order.vehiclePlate || 'N/A'}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${order.status === 'Entregue' ? 'bg-green-100 text-green-800' :
                        order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'Em Trânsito' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                      }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {order.timestamp?.toDate().toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleSendWhatsApp(order)}
                      className="text-green-600 hover:text-green-900 mr-3"
                      title="Enviar via WhatsApp"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5 inline-block align-middle">
                        <path fill="currentColor" d="M380.9 97.1C339.4 55.6 283.8 32 224 32S108.6 55.6 67.1 97.1 32 183.8 32 243.8c0 43.9 12.1 86.8 35.7 124.7L32 480l117.6-30.8c36.9 21.3 78.4 32.8 124.4 32.8 59.9 0 115.5-23.6 157-65.1s65.1-108.1 65.1-168.1c0-59.9-23.6-115.5-65.1-157zM224 448c-44.4 0-86.7-12.2-124.7-35.7L73 430.7l16.1-59.3c-23.6-36.9-35.7-78.4-35.7-124.7 0-44.4 12.2-86.7 35.7-124.7s55.6-65.1 100-65.1c44.4 0 86.7 12.2 124.7 35.7s65.1 55.6 65.1 100c0 44.4-12.2 86.7-35.7 124.7s-55.6 65.1-100 65.1zM336 272c-4.4 0-8-3.6-8-8V200c0-4.4 3.6-8 8-8s8 3.6 8 8v64c0 4.4-3.6 8-8 8zM224 360c-4.4 0-8-3.6-8-8v-80c0-4.4 3.6-8 8-8s8 3.6 8 8v80c0 4.4-3.6 8-8 8zM112 272c-4.4 0-8-3.6-8-8V200c0-4.4 3.6-8 8-8s8 3.6 8 8v64c0 4.4-3.6 8-8 8z" />
                      </svg>
                      <span className="ml-1 hidden sm:inline">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8">Nenhum pedido encontrado. Adicione um novo pedido!</p>
      )}
    </div>
  );
};

// Componente Financeiro
const Financials = () => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Combustível');
  const [loadingExpense, setLoadingExpense] = useState(false);

  useEffect(() => {
    if (!db || !userId) return;

    // Listener para vendas
    const salesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/sales`);
    const qSales = query(salesCollectionRef, orderBy('timestamp', 'desc'));
    const unsubscribeSales = onSnapshot(qSales, (snapshot) => {
      const salesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSales(salesData);
    }, (error) => {
      console.error("Erro ao buscar vendas para financeiro:", error);
      showMessageBox(`Erro ao carregar dados financeiros de vendas: ${error.message}`);
    });

    // Listener para despesas
    const expensesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/expenses`);
    const qExpenses = query(expensesCollectionRef, orderBy('timestamp', 'desc'));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      const expensesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
    }, (error) => {
      console.error("Erro ao buscar despesas para financeiro:", error);
      showMessageBox(`Erro ao carregar dados financeiros de despesas: ${error.message}`);
    });

    return () => {
      unsubscribeSales();
      unsubscribeExpenses();
    };
  }, [db, userId, showMessageBox]);

  const totalSales = sales.reduce((sum, order) => sum + (order.status === 'Entregue' ? order.price : 0), 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalSales - totalExpenses;

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    if (!expenseDescription || !expenseAmount) {
      showMessageBox("Por favor, preencha a descrição e o valor da despesa.");
      return;
    }

    setLoadingExpense(true);
    try {
      const expenseData = {
        description: expenseDescription,
        amount: parseFloat(expenseAmount),
        category: expenseCategory,
        timestamp: Timestamp.now(),
      };
      await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/expenses`), expenseData);
      showMessageBox("Despesa adicionada com sucesso!");
      setExpenseDescription('');
      setExpenseAmount('');
      setExpenseCategory('Combustível');
      setShowAddExpenseForm(false);
    } catch (error) {
      console.error("Erro ao adicionar despesa:", error);
      showMessageBox(`Erro ao adicionar despesa: ${error.message}`);
    } finally {
      setLoadingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    // Implementar um modal de confirmação customizado aqui
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta despesa?"); // Temporário, substituir por modal
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/expenses`, expenseId));
        showMessageBox("Despesa excluída com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir despesa:", error);
        showMessageBox(`Erro ao excluir despesa: ${error.message}`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">Visão Financeira</h2>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-5 rounded-lg shadow-sm text-center">
          <p className="text-lg text-blue-800">Total de Vendas</p>
          <p className="text-3xl font-bold text-blue-700">R$ {totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-5 rounded-lg shadow-sm text-center">
          <p className="text-lg text-red-800">Total de Despesas</p>
          <p className="text-3xl font-bold text-red-700">R$ {totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`p-5 rounded-lg shadow-sm text-center ${netProfit >= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
          <p className={`text-lg ${netProfit >= 0 ? 'text-green-800' : 'text-orange-800'}`}>Lucro Líquido</p>
          <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-700' : 'text-orange-700'}`}>R$ {netProfit.toFixed(2)}</p>
        </div>
      </div>

      {/* Adicionar Nova Despesa */}
      <div className="mb-8">
        <button
          onClick={() => setShowAddExpenseForm(!showAddExpenseForm)}
          className="px-5 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 ease-in-out flex items-center space-x-2"
        >
          {showAddExpenseForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Esconder Formulário</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Adicionar Nova Despesa</span>
            </>
          )}
        </button>

        {showAddExpenseForm && (
          <form onSubmit={handleAddExpense} className="mt-4 p-4 bg-gray-50 rounded-lg shadow-inner space-y-4">
            <h3 className="text-xl font-semibold text-purple-600">Registrar Despesa</h3>
            <div>
              <label htmlFor="expenseDescription" className="block text-sm font-medium text-gray-700">Descrição</label>
              <input
                type="text"
                id="expenseDescription"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="expenseAmount" className="block text-sm font-medium text-gray-700">Valor (R$)</label>
                <input
                  type="number"
                  id="expenseAmount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  step="0.01"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2"
                />
              </div>
              <div>
                <label htmlFor="expenseCategory" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  id="expenseCategory"
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 p-2"
                >
                  <option value="Combustível">Combustível</option>
                  <option value="Manutenção">Manutenção</option>
                  <option value="Salário">Salário</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingExpense}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingExpense ? 'Adicionando...' : 'Adicionar Despesa'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Lista de Despesas */}
      <h3 className="text-xl font-bold text-gray-700 mb-4">Histórico de Despesas</h3>
      {expenses.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-md">Descrição</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-md">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{expense.description}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{expense.category}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">R$ {expense.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                    {expense.timestamp?.toDate().toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8">Nenhuma despesa registrada.</p>
      )}
    </div>
  );
};

// Novo Componente: Gerenciador de Clientes
const CustomerManager = () => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!db || !userId) return;

    const customersCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/customers`);
    const q = query(customersCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customersData);
    }, (error) => {
      console.error("Erro ao buscar clientes:", error);
      showMessageBox(`Erro ao carregar clientes: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessageBox]);

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.name || '');
      setCustomerAddress(selectedCustomer.address || '');
      setCustomerContact(selectedCustomer.contact || '');
      setShowForm(true);
    } else {
      setCustomerName('');
      setCustomerAddress('');
      setCustomerContact('');
    }
  }, [selectedCustomer]);

  const handleAddOrUpdateCustomer = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    if (!customerName || !customerAddress || !customerContact) {
      showMessageBox("Por favor, preencha todos os campos do cliente.");
      return;
    }

    setLoading(true);
    try {
      const customerData = {
        name: customerName,
        address: customerAddress,
        contact: customerContact,
        timestamp: Timestamp.now(),
      };

      if (selectedCustomer) {
        const customerDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/customers`, selectedCustomer.id);
        await updateDoc(customerDocRef, customerData);
        showMessageBox("Cliente atualizado com sucesso!");
      } else {
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/customers`), customerData);
        showMessageBox("Cliente adicionado com sucesso!");
      }
      setSelectedCustomer(null);
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      showMessageBox(`Erro ao salvar cliente: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este cliente? Isso não removerá pedidos associados a ele."); // Temporário
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/customers`, customerId));
        showMessageBox("Cliente excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        showMessageBox(`Erro ao excluir cliente: ${error.message}`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Gerenciar Clientes</h2>
        <button
          onClick={() => { setSelectedCustomer(null); setShowForm(!showForm); }}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out flex items-center space-x-2"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Voltar para Lista</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Novo Cliente</span>
            </>
          )}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleAddOrUpdateCustomer} className="space-y-4 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">{selectedCustomer ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</h3>
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">Nome do Cliente</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div>
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-700">Endereço</label>
            <input
              type="text"
              id="customerAddress"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div>
            <label htmlFor="customerContact" className="block text-sm font-medium text-gray-700">Contato</label>
            <input
              type="text"
              id="customerContact"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { setSelectedCustomer(null); setShowForm(false); }}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (selectedCustomer ? 'Atualizar Cliente' : 'Adicionar Cliente')}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-md">Nome</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-md">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{customer.name}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{customer.address}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{customer.contact}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Nenhum cliente cadastrado. Adicione um novo cliente!</p>
          )}
        </div>
      )}
    </div>
  );
};

// Novo Componente: Gerenciador de Veículos
const VehicleManager = () => {
  const { db, userId, showMessageBox } = useContext(FirebaseContext);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!db || !userId) return;

    const vehiclesCollectionRef = collection(db, `artifacts/${__app_id}/users/${userId}/vehicles`);
    const q = query(vehiclesCollectionRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVehicles(vehiclesData);
    }, (error) => {
      console.error("Erro ao buscar veículos:", error);
      showMessageBox(`Erro ao carregar veículos: ${error.message}`);
    });

    return () => unsubscribe();
  }, [db, userId, showMessageBox]);

  useEffect(() => {
    if (selectedVehicle) {
      setPlate(selectedVehicle.plate || '');
      setModel(selectedVehicle.model || '');
      setCapacity(String(selectedVehicle.capacity) || '');
      setShowForm(true);
    } else {
      setPlate('');
      setModel('');
      setCapacity('');
    }
  }, [selectedVehicle]);

  const handleAddOrUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    if (!plate || !model || !capacity) {
      showMessageBox("Por favor, preencha todos os campos do veículo.");
      return;
    }

    setLoading(true);
    try {
      const vehicleData = {
        plate,
        model,
        capacity: parseInt(capacity),
        timestamp: Timestamp.now(),
      };

      if (selectedVehicle) {
        const vehicleDocRef = doc(db, `artifacts/${__app_id}/users/${userId}/vehicles`, selectedVehicle.id);
        await updateDoc(vehicleDocRef, vehicleData);
        showMessageBox("Veículo atualizado com sucesso!");
      } else {
        await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/vehicles`), vehicleData);
        showMessageBox("Veículo adicionado com sucesso!");
      }
      setSelectedVehicle(null);
      setShowForm(false);
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      showMessageBox(`Erro ao salvar veículo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (!db || !userId) {
      showMessageBox("Erro: Banco de dados não disponível ou usuário não autenticado.");
      return;
    }
    const confirmDelete = window.confirm("Tem certeza que deseja excluir este veículo?"); // Temporário
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/vehicles`, vehicleId));
        showMessageBox("Veículo excluído com sucesso!");
      } catch (error) {
        console.error("Erro ao excluir veículo:", error);
        showMessageBox(`Erro ao excluir veículo: ${error.message}`);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-700">Gerenciar Veículos</h2>
        <button
          onClick={() => { setSelectedVehicle(null); setShowForm(!showForm); }}
          className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ease-in-out flex items-center space-x-2"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              <span>Voltar para Lista</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Novo Veículo</span>
            </>
          )}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={handleAddOrUpdateVehicle} className="space-y-4 p-4 bg-gray-50 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-blue-600 mb-4">{selectedVehicle ? 'Editar Veículo' : 'Adicionar Novo Veículo'}</h3>
          <div>
            <label htmlFor="plate" className="block text-sm font-medium text-gray-700">Placa</label>
            <input
              type="text"
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700">Modelo</label>
            <input
              type="text"
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacidade (Litros)</label>
            <input
              type="number"
              id="capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              min="1000"
              max="10000"
              step="1000"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => { setSelectedVehicle(null); setShowForm(false); }}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition duration-200 ease-in-out"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : (selectedVehicle ? 'Atualizar Veículo' : 'Adicionar Veículo')}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-4 bg-gray-50 rounded-lg shadow-inner">
          {vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-md">Placa</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacidade (L)</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-md">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{vehicle.plate}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{vehicle.model}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{vehicle.capacity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">Nenhum veículo cadastrado. Adicione um novo veículo!</p>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
