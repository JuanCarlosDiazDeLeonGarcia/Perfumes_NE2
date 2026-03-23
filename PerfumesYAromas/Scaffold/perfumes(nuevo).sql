--
-- PostgreSQL database dump
--

\restrict MefVwPhQ419P0BrF6iKBNiaHu36uDisMZnzMRxANqekWCXdM3nHXoBdWKJG2GIg

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-03-18 07:53:51

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 247 (class 1255 OID 24896)
-- Name: actualizar_fecha_vendedores(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_fecha_vendedores() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_fecha_vendedores() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 24897)
-- Name: carrito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito (
    id integer CONSTRAINT detalle_pedidos_id_not_null NOT NULL,
    pedido_id integer CONSTRAINT detalle_pedidos_pedido_id_not_null NOT NULL,
    producto_id integer CONSTRAINT detalle_pedidos_producto_id_not_null NOT NULL,
    cantidad integer CONSTRAINT detalle_pedidos_cantidad_not_null NOT NULL,
    precio_unitario numeric(10,2) CONSTRAINT detalle_pedidos_precio_unitario_not_null NOT NULL,
    subtotal numeric(10,2) CONSTRAINT detalle_pedidos_subtotal_not_null NOT NULL,
    descuento numeric(10,2) DEFAULT 0,
    CONSTRAINT detalle_pedidos_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.carrito OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 24908)
-- Name: carrito_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito_items (
    id integer NOT NULL,
    carrito_id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carrito_items_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.carrito_items OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24917)
-- Name: carrito_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carrito_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carrito_items_id_seq OWNER TO postgres;

--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 221
-- Name: carrito_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carrito_items_id_seq OWNED BY public.carrito_items.id;


--
-- TOC entry 222 (class 1259 OID 24918)
-- Name: carritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carritos (
    id integer NOT NULL,
    cliente_id integer,
    session_id character varying(255),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.carritos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24924)
-- Name: carritos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carritos_id_seq OWNER TO postgres;

--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 223
-- Name: carritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carritos_id_seq OWNED BY public.carritos.id;


--
-- TOC entry 224 (class 1259 OID 24925)
-- Name: categorias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categorias (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion text,
    activa boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.categorias OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24934)
-- Name: categorias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categorias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_id_seq OWNER TO postgres;

--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 225
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 226 (class 1259 OID 24935)
-- Name: clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clientes (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    correo character varying(100),
    telefono character varying(20),
    empresa character varying(150),
    direccion text,
    ciudad character varying(100),
    estado character varying(100),
    codigo_postal character varying(10),
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado_cliente character varying(20) DEFAULT 'activo'::character varying,
    etapa_crm character varying(20) DEFAULT 'Prospecto'::character varying,
    notas text,
    fecha_nacimiento date,
    genero character varying(20),
    usuario_registro_id integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    password character varying DEFAULT 10 NOT NULL,
    CONSTRAINT clientes_estado_cliente_check CHECK (((estado_cliente)::text = ANY (ARRAY[('activo'::character varying)::text, ('inactivo'::character varying)::text]))),
    CONSTRAINT clientes_etapa_crm_check CHECK (((etapa_crm)::text = ANY (ARRAY[('Prospecto'::character varying)::text, ('Activo'::character varying)::text, ('Frecuente'::character varying)::text, ('Inactivo'::character varying)::text])))
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24950)
-- Name: clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 227
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 228 (class 1259 OID 24951)
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.detalle_pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.detalle_pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 228
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedidos_id_seq OWNED BY public.carrito.id;


--
-- TOC entry 229 (class 1259 OID 24952)
-- Name: interacciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.interacciones (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    descripcion text NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    usuario_id integer,
    resultado character varying(100),
    seguimiento boolean DEFAULT false,
    fecha_seguimiento date,
    producto_mencionado_id integer,
    CONSTRAINT interacciones_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('llamada'::character varying)::text, ('correo'::character varying)::text, ('reunion'::character varying)::text, ('whatsapp'::character varying)::text, ('visita'::character varying)::text, ('otro'::character varying)::text])))
);


ALTER TABLE public.interacciones OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 24964)
-- Name: interacciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.interacciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.interacciones_id_seq OWNER TO postgres;

--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 230
-- Name: interacciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interacciones_id_seq OWNED BY public.interacciones.id;


--
-- TOC entry 231 (class 1259 OID 24965)
-- Name: metricas_clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metricas_clientes (
    id integer NOT NULL,
    cliente_id integer,
    total_interacciones integer DEFAULT 0,
    ultima_interaccion timestamp without time zone,
    dias_sin_contacto integer,
    total_compras integer DEFAULT 0,
    valor_total_compras numeric(10,2) DEFAULT 0.00,
    ticket_promedio numeric(10,2) DEFAULT 0.00,
    puntuacion_satisfaccion integer,
    fecha_calculo timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT metricas_clientes_puntuacion_satisfaccion_check CHECK (((puntuacion_satisfaccion >= 1) AND (puntuacion_satisfaccion <= 10)))
);


ALTER TABLE public.metricas_clientes OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 24975)
-- Name: metricas_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metricas_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metricas_clientes_id_seq OWNER TO postgres;

--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 232
-- Name: metricas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metricas_clientes_id_seq OWNED BY public.metricas_clientes.id;


--
-- TOC entry 246 (class 1259 OID 25226)
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(20) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_inventario_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_inventario_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying])::text[])))
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 25225)
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.movimientos_inventario_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.movimientos_inventario_id_seq OWNER TO postgres;

--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 245
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_inventario_id_seq OWNED BY public.movimientos_inventario.id;


--
-- TOC entry 233 (class 1259 OID 24976)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    numero_orden character varying(50) NOT NULL,
    cliente_id integer,
    vendedor_id integer,
    producto_id integer,
    cantidad integer DEFAULT 1,
    subtotal numeric(10,2) DEFAULT 0 NOT NULL,
    impuestos numeric(10,2) DEFAULT 0,
    descuento numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    metodo_pago character varying(50),
    direccion_envio text,
    notas text,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion timestamp without time zone,
    fecha_envio timestamp without time zone,
    fecha_entrega timestamp without time zone,
    CONSTRAINT pedidos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('confirmado'::character varying)::text, ('procesando'::character varying)::text, ('enviado'::character varying)::text, ('entregado'::character varying)::text, ('cancelado'::character varying)::text])))
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 24993)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 234
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 235 (class 1259 OID 24994)
-- Name: productos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    descripcion text,
    precio numeric(10,2) NOT NULL,
    stock integer DEFAULT 0,
    stock_minimo integer DEFAULT 10,
    vendedor_id integer,
    imagen_url text,
    marca character varying(100),
    genero character varying(20),
    tamanio_ml integer,
    notas_olfativas text,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    proveedor_id integer DEFAULT 2 NOT NULL,
    restock text,
    CONSTRAINT productos_genero_check CHECK (((genero)::text = ANY (ARRAY[('Hombre'::character varying)::text, ('Mujer'::character varying)::text, ('Unisex'::character varying)::text]))),
    CONSTRAINT productos_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 25012)
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_id_seq OWNER TO postgres;

--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 236
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 237 (class 1259 OID 25013)
-- Name: productos_proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.productos_proveedores (
    id integer NOT NULL,
    producto_id integer,
    proveedor_id integer,
    precio_proveedor numeric(10,2),
    tiempo_entrega_dias integer,
    cantidad_minima integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.productos_proveedores OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 25018)
-- Name: productos_proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.productos_proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.productos_proveedores_id_seq OWNER TO postgres;

--
-- TOC entry 5142 (class 0 OID 0)
-- Dependencies: 238
-- Name: productos_proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_proveedores_id_seq OWNED BY public.productos_proveedores.id;


--
-- TOC entry 239 (class 1259 OID 25019)
-- Name: proveedores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    contacto character varying(100),
    email character varying(100),
    telefono character varying(20),
    direccion text,
    ciudad character varying(100),
    pais character varying(100),
    calificacion integer,
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT proveedores_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);


ALTER TABLE public.proveedores OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 25029)
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proveedores_id_seq OWNER TO postgres;

--
-- TOC entry 5143 (class 0 OID 0)
-- Dependencies: 240
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 241 (class 1259 OID 25030)
-- Name: seguimiento_pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.seguimiento_pedidos (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    vendedor_id integer NOT NULL,
    pedido_id integer NOT NULL,
    estado_paquete character varying(50) DEFAULT 'en_proceso'::character varying,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ubicacion_actual character varying(200),
    descripcion text,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT seguimiento_pedidos_estado_paquete_check CHECK (((estado_paquete)::text = ANY (ARRAY[('en_proceso'::character varying)::text, ('en_transito'::character varying)::text, ('en_reparto'::character varying)::text, ('entregado'::character varying)::text, ('cancelado'::character varying)::text])))
);


ALTER TABLE public.seguimiento_pedidos OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 25043)
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seguimiento_pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seguimiento_pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 5144 (class 0 OID 0)
-- Dependencies: 242
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimiento_pedidos_id_seq OWNED BY public.seguimiento_pedidos.id;


--
-- TOC entry 243 (class 1259 OID 25044)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash character varying(255) NOT NULL,
    rol character varying(20) DEFAULT 'usuario'::character varying,
    telefono character varying(20),
    activo boolean DEFAULT true,
    ultimo_login timestamp without time zone,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 25058)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 5145 (class 0 OID 0)
-- Dependencies: 244
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4821 (class 2604 OID 25059)
-- Name: carrito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedidos_id_seq'::regclass);


--
-- TOC entry 4823 (class 2604 OID 25060)
-- Name: carrito_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items ALTER COLUMN id SET DEFAULT nextval('public.carrito_items_id_seq'::regclass);


--
-- TOC entry 4825 (class 2604 OID 25061)
-- Name: carritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos ALTER COLUMN id SET DEFAULT nextval('public.carritos_id_seq'::regclass);


--
-- TOC entry 4828 (class 2604 OID 25062)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 25063)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 25064)
-- Name: interacciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones ALTER COLUMN id SET DEFAULT nextval('public.interacciones_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 25065)
-- Name: metricas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes ALTER COLUMN id SET DEFAULT nextval('public.metricas_clientes_id_seq'::regclass);


--
-- TOC entry 4874 (class 2604 OID 25229)
-- Name: movimientos_inventario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id SET DEFAULT nextval('public.movimientos_inventario_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 25066)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4853 (class 2604 OID 25067)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4860 (class 2604 OID 25068)
-- Name: productos_proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores ALTER COLUMN id SET DEFAULT nextval('public.productos_proveedores_id_seq'::regclass);


--
-- TOC entry 4862 (class 2604 OID 25069)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4865 (class 2604 OID 25070)
-- Name: seguimiento_pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos ALTER COLUMN id SET DEFAULT nextval('public.seguimiento_pedidos_id_seq'::regclass);


--
-- TOC entry 4869 (class 2604 OID 25071)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5099 (class 0 OID 24897)
-- Dependencies: 219
-- Data for Name: carrito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal, descuento) FROM stdin;
1	1	10	2	30.00	60.00	0.00
2	1	7	1	38.00	38.00	0.00
3	2	3	3	35.00	105.00	0.00
\.


--
-- TOC entry 5100 (class 0 OID 24908)
-- Dependencies: 220
-- Data for Name: carrito_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito_items (id, carrito_id, producto_id, cantidad, fecha_agregado) FROM stdin;
\.


--
-- TOC entry 5102 (class 0 OID 24918)
-- Dependencies: 222
-- Data for Name: carritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carritos (id, cliente_id, session_id, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5104 (class 0 OID 24925)
-- Dependencies: 224
-- Data for Name: categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categorias (id, nombre, descripcion, activa, fecha_creacion) FROM stdin;
1	Fragancias Masculinas	Perfumes y colonias para hombre	t	2026-02-04 21:12:51.404965
2	Fragancias Femeninas	Perfumes y colonias para mujer	t	2026-02-04 21:12:51.404965
3	Fragancias Unisex	Perfumes para cualquier género	t	2026-02-04 21:12:51.404965
4	Ediciones Limitadas	Fragancias exclusivas y de temporada	t	2026-02-04 21:12:51.404965
5	Aromáticos	Fragancias con notas aromáticas destacadas	t	2026-02-04 21:12:51.404965
\.


--
-- TOC entry 5106 (class 0 OID 24935)
-- Dependencies: 226
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, nombre, correo, telefono, empresa, direccion, ciudad, estado, codigo_postal, fecha_registro, estado_cliente, etapa_crm, notas, fecha_nacimiento, genero, usuario_registro_id, fecha_actualizacion, password) FROM stdin;
4	Laura Ramírez Torres	laura.ramirez@yahoo.com	449-456-7890	Tienda Fashion Boutique	Av. Hidalgo 321	Zacatecas	Zacatecas	98000	2026-02-04 21:12:51.404965	inactivo	Inactivo	\N	\N	\N	1	2026-02-04 21:12:51.404965	10
5	Nestor Rangel Reyes	nestor.rangel@gmail.com	449-512-8713	Almacenes Lujo Total	Av. Universidad 654	Aguascalientes	Aguascalientes	20200	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
6	Sofía Bueno Ruiz	sofia.bueno@gmail.com	449-678-9012	\N	Calle Juárez 987	Aguascalientes	Aguascalientes	20300	2026-02-04 21:12:51.404965	activo	Frecuente	\N	\N	\N	3	2026-02-04 21:12:51.404965	10
7	Miguel Ángel Flores	miguel.flores@hotmail.com	449-789-0123	Perfumes y Más	Av. Carranza 147	San Luis Potosí	San Luis Potosí	78000	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
8	Mariana Torres Díaz	mariana.torres@outlook.com	449-890-1234	\N	Calle Allende 258	Aguascalientes	Aguascalientes	20400	2026-02-04 21:12:51.404965	activo	Prospecto	\N	\N	\N	1	2026-02-04 21:12:51.404965	10
9	Hola	hola@hola.com	321082190123	\N	hola 32	hola	hola	40918	2026-02-09 23:12:58.245782	activo	Prospecto	\N	2008-02-06	Femenino	\N	2026-02-09 23:12:58.245782	holahola
2	Ana Laura Sáncho	ana.sanchez@outlook.com	449-234-5678	Boutique Aromas del Valle	Blvd. Adolfo López Mateos 456	León	Guanajuato	37000	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	Femenino	2	2026-02-10 06:52:27.728211	10
10	Juan	odis@hotmail.com	4935825356aa	\N	\N	\N	\N	\N	2026-02-10 07:49:15.597903	activo	Prospecto	\N	\N	Masculino	\N	2026-02-10 07:51:24.402078	odis22
1	Diego Franco Escobedo	diego.franco@gmail.com	449-123-4567	Perfumería Elegancia	Av. Constitución 123	Aguascalientes	Aguascalientes	20000	2026-02-04 21:12:51.404965	activo	Frecuente	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
3	Cristian Moreno Ovalle	cristian.moreno@hotmail.com	449-345-6789	Distribuidora Fragancias SA	Calle Madero 789	Aguascalientes	Aguascalientes	20100	2026-02-04 21:12:51.404965	activo	Prospecto	\N	\N	\N	3	2026-02-04 21:12:51.404965	10
\.


--
-- TOC entry 5109 (class 0 OID 24952)
-- Dependencies: 229
-- Data for Name: interacciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.interacciones (id, cliente_id, tipo, descripcion, fecha, usuario_id, resultado, seguimiento, fecha_seguimiento, producto_mencionado_id) FROM stdin;
1	1	llamada	Primera llamada de seguimiento. Cliente muy interesado en línea premium de perfumes masculinos.	2026-02-04 21:12:51.404965	2	Positivo - Interesado	f	\N	10
2	1	reunion	Reunión presencial. Presentación de catálogo 2024. Realizó pedido de 50 unidades de SAUVAGE DIOR.	2026-02-04 21:12:51.404965	2	Venta cerrada	f	\N	10
3	2	correo	Envío de propuesta comercial con descuentos especiales por volumen. Interesada en Versace y JPG.	2026-02-04 21:12:51.404965	3	Pendiente de respuesta	f	\N	7
4	2	llamada	Seguimiento de propuesta enviada. Solicita más tiempo para evaluar con su socio.	2026-02-04 21:12:51.404965	3	En proceso de decisión	f	\N	\N
5	3	whatsapp	Contacto inicial por recomendación. Muy interesado en convertirse en distribuidor autorizado.	2026-02-04 21:12:51.404965	3	Prospecto calificado	f	\N	\N
6	5	reunion	Reunión en sus instalaciones. Acuerdo de distribución firmado. Primera orden de 100 unidades.	2026-02-04 21:12:51.404965	2	Contrato firmado	f	\N	\N
7	6	llamada	Cliente recurrente solicita reabastecimiento de INVICTUS y COOL WATER.	2026-02-04 21:12:51.404965	3	Pedido programado	f	\N	6
8	6	visita	Visita a tienda física. Compra directa de 3 perfumes para regalo.	2026-02-04 21:12:51.404965	3	Venta realizada	f	\N	\N
9	7	correo	Envío de nuevo catálogo de fragancias árabes. Mostró interés en KHALAF LATTAFA.	2026-02-04 21:12:51.404965	2	Interesado	f	\N	3
10	8	whatsapp	Consulta sobre disponibilidad de perfumes cítricos frescos para temporada de verano.	2026-02-04 21:12:51.404965	1	Información proporcionada	f	\N	12
\.


--
-- TOC entry 5111 (class 0 OID 24965)
-- Dependencies: 231
-- Data for Name: metricas_clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metricas_clientes (id, cliente_id, total_interacciones, ultima_interaccion, dias_sin_contacto, total_compras, valor_total_compras, ticket_promedio, puntuacion_satisfaccion, fecha_calculo) FROM stdin;
1	9	0	\N	\N	0	0.00	0.00	\N	2026-02-09 23:12:58.745049
2	10	0	\N	\N	0	0.00	0.00	\N	2026-02-10 07:49:17.762476
11	1	2	2026-02-05 10:00:00	3	1	150.00	150.00	8	2026-02-16 07:20:02.939335
12	2	2	2025-12-20 15:30:00	50	0	0.00	0.00	6	2026-02-16 07:20:02.939335
13	3	1	2026-01-30 09:15:00	9	0	0.00	0.00	7	2026-02-16 07:20:02.939335
14	4	0	\N	120	0	0.00	0.00	4	2026-02-16 07:20:02.939335
15	5	1	2026-01-15 11:00:00	24	1	2500.00	2500.00	9	2026-02-16 07:20:02.939335
16	6	2	2026-02-02 14:20:00	6	1	180.00	180.00	7	2026-02-16 07:20:02.939335
17	7	1	2026-01-20 10:00:00	19	0	0.00	0.00	6	2026-02-16 07:20:02.939335
18	8	1	2026-02-04 16:30:00	4	0	0.00	0.00	7	2026-02-16 07:20:02.939335
\.


--
-- TOC entry 5126 (class 0 OID 25226)
-- Dependencies: 246
-- Data for Name: movimientos_inventario; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.movimientos_inventario (id, producto_id, tipo, cantidad, motivo, fecha) FROM stdin;
1	10	salida	2	venta	2026-03-04 22:09:49.658491
2	1	entrada	20	reposicion	2026-03-04 22:09:49.658491
3	4	salida	3	venta	2026-03-04 22:09:49.658491
4	13	salida	1	ajuste	2026-03-04 22:09:49.658491
5	6	entrada	15	reposicion	2026-03-04 22:09:49.658491
6	9	salida	4	venta	2026-03-04 22:09:49.658491
7	12	entrada	5	ajuste	2026-03-04 22:09:49.658491
8	7	salida	2	venta	2026-03-04 22:09:49.658491
9	2	entrada	25	reposicion	2026-03-04 22:09:49.658491
10	8	salida	1	venta	2026-03-04 22:09:49.658491
13	13	entrada	10	prueba	2026-03-09 07:35:37.471757
14	13	entrada	10	yoooooooooooo	2026-03-09 07:41:03.071072
\.


--
-- TOC entry 5113 (class 0 OID 24976)
-- Dependencies: 233
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, numero_orden, cliente_id, vendedor_id, producto_id, cantidad, subtotal, impuestos, descuento, total, estado, metodo_pago, direccion_envio, notas, fecha_pedido, fecha_confirmacion, fecha_envio, fecha_entrega) FROM stdin;
1	ORD-001	4	1	10	2	500.00	0.00	0.00	580.00	entregado	tarjeta	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N
2	ORD-002	4	1	7	3	750.00	0.00	0.00	870.00	enviado	transferencia	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N
8	ORD-100	4	1	3	2	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
12	ORD-101	2	6	4	3	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
9	ORD-103	6	6	1	4	500.00	0.00	0.00	580.00	entregado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:19:13.055228
10	ORD-104	7	6	9	2	500.00	0.00	0.00	580.00	entregado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:20:20.611367
14	P1773293241529	8	6	13	5	275.00	0.00	0.00	275.00	pendiente	tarjeta	Una ciudad	correr	2026-03-11 23:27:21.530264	\N	\N	\N
13	ORD-105	5	6	10	2	60.00	0.00	0.00	60.00	pendiente	tarjeta			2026-03-04 10:00:00	\N	\N	\N
\.


--
-- TOC entry 5115 (class 0 OID 24994)
-- Dependencies: 235
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, descripcion, precio, stock, stock_minimo, vendedor_id, imagen_url, marca, genero, tamanio_ml, notas_olfativas, activo, fecha_creacion, fecha_actualizacion, proveedor_id, restock) FROM stdin;
1	NAVIGO	Aromas frescos y delicados con notas de jazmín y rosa.	25.00	50	10	3	https://cdn5.coppel.com/mkp/103020481-1.jpg	Navigo	Unisex	100	Jazmín, Rosa, Notas Florales	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
5	9AM	Notas cálidas de sándalo y cedro para un aroma intenso.	28.00	40	10	3	https://beautyfreeshop.com.mx/cdn/shop/files/perfume-9am-dive-unisex-de-afnan-edp-100ml-arome-mexico-1_800x_255077d6-54df-4360-b1ed-c9d48edb8a13.jpg?v=1727982720	Afnan	Unisex	100	Fresco, Acuático, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
11	Perfume Amaderado	Notas cálidas de sándalo y cedro para un aroma intenso.	39.00	28	8	5	https://perfumerica.mx/cdn/shop/files/HC3A.png?v=1708969297&width=2048	Casa Propia	Hombre	100	Sándalo, Cedro, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
12	Perfume Cítrico	Frescura vibrante con notas de limón y bergamota.	22.00	70	15	5	https://m.media-amazon.com/images/I/71-w3x3BP-L._AC_SX522_.jpg	Casa Propia	Unisex	100	Limón, Bergamota, Cítrico	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
2	ODYSSEY	Notas cálidas de sándalo y cedro para un aroma intenso.	30.00	45	10	6	https://cazanovaonline.mx/cdn/shop/files/ANUNNCIO_Amazon_37.jpg?v=1747758258&width=1946	Odyssey	Hombre	100	Sándalo, Cedro, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
3	KHALAF LATTAFA	Notas cálidas de sándalo y cedro para un aroma intenso.	35.00	30	8	6	https://perfumes-arabes.mx/wp-content/uploads/2023/10/Perfume-Lattafa-Khamrah-Perfumes-Arabes-Mexico.jpeg	Lattafa	Hombre	100	Sándalo, Cedro, Especiado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
4	9PM	Notas cálidas de sándalo y cedro para un aroma intenso.	45.00	25	8	6	https://m.media-amazon.com/images/I/41ZQdV659VL.jpg	Afnan	Hombre	100	Amaderado, Especiado, Intenso	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
7	VERSACE EROS FLAME	Notas cálidas de sándalo y cedro para un aroma intenso.	38.00	35	10	6	https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dw74626350/original/90_R741010-R100MLS_RNUL_20_Eros~Flame~EDP~100~ml-Accessories-Versace-online-store_0_1.jpg?sw=1200&q=85&strip=true	Versace	Hombre	100	Cítrico, Especiado, Sensual	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
8	JPG LE BEAU LE PARFUM	Notas cálidas de sándalo y cedro para un aroma intenso.	50.00	20	8	6	https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_webp,s_webp/nuestrasfragancias.com/wp-content/uploads/2022/06/Le-Beau-Le-Parfum-125ml-EDP.webp	Jean Paul Gaultier	Hombre	125	Aromático, Fresco, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
9	COOL WATER	Aroma fresco y acuático con notas marinas.	34.00	60	15	6	https://m.media-amazon.com/images/I/91xkVmTPE3L._UF350,350_QL80_.jpg	Davidoff	Hombre	125	Acuático, Marino, Fresco	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
10	SAUVAGE DIOR	Notas cálidas de sándalo combinadas con frescura.	30.00	50	12	6	https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Library-Sites-DiorSharedLibrary/default/dwf80880b6/images/beauty/01-FRAGRANCES/2025/PDP-REVAMP/SAUVAGE/Y0785220/POSTER_DIOR_SAUVAGE_CAPSULE_EDP_VA_916.jpg?sw=800	Dior	Hombre	100	Amaderado, Especiado, Fresco	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push
6	INVICTUS	Notas cálidas de sándalo y cedro para un aroma intenso.	30.00	55	12	6	https://fraganciasfiord.com.mx/wp-content/uploads/2024/06/Decant-o-muestra-del-perfume-Invictus-PARFUM-original-de-Rabanne-en-Fragancias-Fiord.jpg	Paco Rabanne	Hombre	100	Marino, Amaderado, Deportivo	t	2026-02-04 21:12:51.404965	2026-02-19 07:28:50.087246	2	push
14	Perfume	Es nuevo	49.00	50	9	6	https://www.google.com/url?sa=t&source=web&rct=j&url=https%3A%2F%2Fes.vecteezy.com%2Farte-vectorial%2F8921985-botella-de-perfume-dibujada-a-mano-ilustracion-vectorial-sobre-fondo-blanco&ved=0CBYQjRxqFwoTCMjT0_LsiJMDFQAAAAAdAAAAABAH&opi=89978449	ACME	Hombre	200	Es bueno	t	2026-03-05 07:21:09.712955	2026-03-05 07:21:09.712955	7	pull
15	hola		70.00	6	5	6		yo	Unisex	80		t	2026-03-05 07:30:36.458162	2026-03-05 07:30:36.458162	8	push
13	BLACK ORCHID	Una fragancia seductora con notas oscuras de orquídea negra y especias.	55.00	43	7	6	https://m.media-amazon.com/images/I/41EXXOm0GBL._AC_UF894,1000_QL80_.jpg	Tom Ford	Mujer	100	Orquídea Negra, Especias, Chocolate	t	2026-03-04 10:00:00	2026-03-09 07:41:03.066823	2	pull
\.


--
-- TOC entry 5117 (class 0 OID 25013)
-- Dependencies: 237
-- Data for Name: productos_proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos_proveedores (id, producto_id, proveedor_id, precio_proveedor, tiempo_entrega_dias, cantidad_minima, fecha_creacion) FROM stdin;
1	1	1	15.00	7	20	2026-02-04 21:12:51.404965
2	2	1	18.00	7	20	2026-02-04 21:12:51.404965
3	3	2	20.00	10	15	2026-02-04 21:12:51.404965
4	4	2	25.00	10	15	2026-02-04 21:12:51.404965
5	5	1	16.00	7	20	2026-02-04 21:12:51.404965
6	6	3	18.00	15	25	2026-02-04 21:12:51.404965
7	7	3	22.00	15	20	2026-02-04 21:12:51.404965
8	8	3	28.00	15	15	2026-02-04 21:12:51.404965
9	9	1	19.00	7	30	2026-02-04 21:12:51.404965
10	10	3	18.00	15	25	2026-02-04 21:12:51.404965
11	11	1	22.00	7	15	2026-02-04 21:12:51.404965
12	12	1	13.00	7	30	2026-02-04 21:12:51.404965
\.


--
-- TOC entry 5119 (class 0 OID 25019)
-- Dependencies: 239
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, nombre, contacto, email, telefono, direccion, ciudad, pais, calificacion, activo, fecha_creacion) FROM stdin;
1	Distribuidora Internacional Fragancias	Luis Mendoza	compras@difragancias.com	+52-449-111-2222	\N	Aguascalientes	México	5	t	2026-02-04 21:12:51.404965
2	Importadora Aromas del Mundo	Carmen Vega	ventas@aromasmundo.com	+52-33-3333-4444	\N	Guadalajara	México	4	t	2026-02-04 21:12:51.404965
3	Perfumes Europeos SA de CV	Antonio Ruiz	info@perfumeseur.com	+52-55-5555-6666	\N	Ciudad de México	México	5	t	2026-02-04 21:12:51.404965
4	Distribuidora Internacional Fragancias	Luis Mendoza	compras@difragancias.com	+52-449-111-2222	\N	Aguascalientes	México	5	t	2026-02-16 07:23:30.041368
5	Importadora Aromas del Mundo	Carmen Vega	ventas@aromasmundo.com	+52-33-3333-4444	\N	Guadalajara	México	4	t	2026-02-16 07:23:30.041368
6	Perfumes Europeos SA de CV	Antonio Ruiz	info@perfumeseur.com	+52-55-5555-6666	\N	Ciudad de México	México	5	t	2026-02-16 07:23:30.041368
7	hola	49832904	holaprove@gmail.com	43928039	\N	otra	otro	\N	t	2026-03-04 21:14:35.780024
8	Victoria Secret	Diego Spreen	diego@gmail.com	4491234578	\N	Aguascalientes	Mexico	\N	t	2026-03-05 07:27:22.632444
\.


--
-- TOC entry 5121 (class 0 OID 25030)
-- Dependencies: 241
-- Data for Name: seguimiento_pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seguimiento_pedidos (id, cliente_id, vendedor_id, pedido_id, estado_paquete, fecha_pedido, ubicacion_actual, descripcion, fecha_actualizacion) FROM stdin;
6	2	3	2	en_proceso	2026-02-08 10:30:00	Almacén principal - Preparando envío	Pedido confirmado, empaquetando productos	2026-02-16 07:26:42.194911
7	5	2	2	entregado	2026-01-15 14:00:00	Entregado en domicilio	Pedido entregado exitosamente - Firmado por cliente	2026-02-16 07:26:42.194911
8	6	1	1	en_reparto	2026-02-10 08:00:00	Repartidor - Zona centro Aguascalientes	En ruta de entrega, llegada estimada 12:00 PM	2026-02-16 07:26:42.194911
5	3	1	1	en_transito	2026-02-05 09:00:00	Centro de distribución - Aguascalientes	Paquete en tránsito hacia destino final	2026-02-16 07:26:42.194911
\.


--
-- TOC entry 5123 (class 0 OID 25044)
-- Dependencies: 243
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, rol, telefono, activo, ultimo_login, fecha_creacion, fecha_actualizacion) FROM stdin;
1	Administrador Sistema	admin@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0001	t	2026-02-10 20:18:34.785737	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
2	Juan Carlos Díaz	juan@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0002	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
3	María González	maria@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0003	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
6	vendedor	vende@gmail.com	$2b$10$vende22	vendedor	593-523-5323	t	2026-03-12 13:15:28.912009	2026-03-03 17:38:33.963407	2026-03-03 17:38:33.963407
5	Diego Franco	diego@gmail.com	$2b$10$messi1010	admin	496-123-4567	t	2026-03-04 21:43:57.795119	2026-02-10 07:54:48.647442	2026-02-10 07:54:48.647442
7	Juan Carlos	carlos@gmail.com	$2b$10$juan44	admin	503-984-9082	t	2026-03-18 07:37:39.504805	2026-03-04 21:20:50.95558	2026-03-04 21:20:50.95558
4	Fernando Rangel	fernando@perfumesne2.com	$2b$10$fern10	estadistica	449-000-0004	t	2026-03-18 07:44:40.345286	2026-02-04 21:12:51.404965	2026-03-12 07:19:22.284127
\.


--
-- TOC entry 5146 (class 0 OID 0)
-- Dependencies: 221
-- Name: carrito_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carrito_items_id_seq', 1, false);


--
-- TOC entry 5147 (class 0 OID 0)
-- Dependencies: 223
-- Name: carritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carritos_id_seq', 1, false);


--
-- TOC entry 5148 (class 0 OID 0)
-- Dependencies: 225
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 6, true);


--
-- TOC entry 5149 (class 0 OID 0)
-- Dependencies: 227
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 10, true);


--
-- TOC entry 5150 (class 0 OID 0)
-- Dependencies: 228
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedidos_id_seq', 3, true);


--
-- TOC entry 5151 (class 0 OID 0)
-- Dependencies: 230
-- Name: interacciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interacciones_id_seq', 10, true);


--
-- TOC entry 5152 (class 0 OID 0)
-- Dependencies: 232
-- Name: metricas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metricas_clientes_id_seq', 18, true);


--
-- TOC entry 5153 (class 0 OID 0)
-- Dependencies: 245
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_seq', 14, true);


--
-- TOC entry 5154 (class 0 OID 0)
-- Dependencies: 234
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 14, true);


--
-- TOC entry 5155 (class 0 OID 0)
-- Dependencies: 236
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 15, true);


--
-- TOC entry 5156 (class 0 OID 0)
-- Dependencies: 238
-- Name: productos_proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_proveedores_id_seq', 12, true);


--
-- TOC entry 5157 (class 0 OID 0)
-- Dependencies: 240
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 8, true);


--
-- TOC entry 5158 (class 0 OID 0)
-- Dependencies: 242
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimiento_pedidos_id_seq', 8, true);


--
-- TOC entry 5159 (class 0 OID 0)
-- Dependencies: 244
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 7, true);


--
-- TOC entry 4894 (class 2606 OID 25073)
-- Name: carrito_items carrito_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 25075)
-- Name: carritos carritos_cliente_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_cliente_id_session_id_key UNIQUE (cliente_id, session_id);


--
-- TOC entry 4898 (class 2606 OID 25077)
-- Name: carritos carritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_pkey PRIMARY KEY (id);


--
-- TOC entry 4900 (class 2606 OID 25079)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 4902 (class 2606 OID 25081)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4904 (class 2606 OID 25083)
-- Name: clientes clientes_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_correo_key UNIQUE (correo);


--
-- TOC entry 4906 (class 2606 OID 25085)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 25087)
-- Name: carrito detalle_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 25089)
-- Name: interacciones interacciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4910 (class 2606 OID 25091)
-- Name: metricas_clientes metricas_clientes_cliente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_key UNIQUE (cliente_id);


--
-- TOC entry 4912 (class 2606 OID 25093)
-- Name: metricas_clientes metricas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4932 (class 2606 OID 25240)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- TOC entry 4914 (class 2606 OID 25095)
-- Name: pedidos pedidos_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_numero_orden_key UNIQUE (numero_orden);


--
-- TOC entry 4916 (class 2606 OID 25097)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 25099)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 25101)
-- Name: productos_proveedores productos_proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4922 (class 2606 OID 25103)
-- Name: productos_proveedores productos_proveedores_producto_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_proveedor_id_key UNIQUE (producto_id, proveedor_id);


--
-- TOC entry 4924 (class 2606 OID 25105)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 25107)
-- Name: seguimiento_pedidos seguimiento_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4928 (class 2606 OID 25109)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4930 (class 2606 OID 25111)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4935 (class 2606 OID 25112)
-- Name: carrito_items carrito_items_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 25117)
-- Name: carrito_items carrito_items_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4937 (class 2606 OID 25122)
-- Name: carritos carritos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4938 (class 2606 OID 25127)
-- Name: clientes clientes_usuario_registro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_registro_id_fkey FOREIGN KEY (usuario_registro_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4933 (class 2606 OID 25132)
-- Name: carrito detalle_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 25137)
-- Name: carrito detalle_pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4951 (class 2606 OID 25241)
-- Name: movimientos_inventario fk_movimiento_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4939 (class 2606 OID 25142)
-- Name: interacciones interacciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4940 (class 2606 OID 25147)
-- Name: interacciones interacciones_producto_mencionado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_producto_mencionado_id_fkey FOREIGN KEY (producto_mencionado_id) REFERENCES public.productos(id);


--
-- TOC entry 4941 (class 2606 OID 25152)
-- Name: interacciones interacciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4942 (class 2606 OID 25157)
-- Name: metricas_clientes metricas_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4943 (class 2606 OID 25162)
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4944 (class 2606 OID 25172)
-- Name: pedidos pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4945 (class 2606 OID 25167)
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4946 (class 2606 OID 25177)
-- Name: productos_proveedores productos_proveedores_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4947 (class 2606 OID 25182)
-- Name: productos_proveedores productos_proveedores_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- TOC entry 4948 (class 2606 OID 25187)
-- Name: seguimiento_pedidos seguimiento_pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4949 (class 2606 OID 25192)
-- Name: seguimiento_pedidos seguimiento_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4950 (class 2606 OID 25197)
-- Name: seguimiento_pedidos seguimiento_pedidos_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- Tabla: recursos_empresa - Recursos físicos de la empresa (impresoras, computadoras, etc.)
--

CREATE TABLE public.recursos_empresa (
    id SERIAL PRIMARY KEY,
    nombre character varying(100) NOT NULL,
    categoria character varying(50) NOT NULL,
    descripcion text,
    numero_serie character varying(100),
    marca character varying(50),
    modelo character varying(50),
    ubicacion character varying(100),
    estado character varying(20) DEFAULT 'disponible',
    cantidad integer DEFAULT 1,
    fecha_adquisicion date,
    costo_adquisicion numeric(12,2),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recursos_empresa_estado_check CHECK ((estado)::text = ANY ((ARRAY['disponible'::character varying, 'en_uso'::character varying, 'mantenimiento'::character varying, 'baja'::character varying])::text[]))
);

ALTER TABLE public.recursos_empresa OWNER TO postgres;

--
-- Secuencia para movimientos_recursos
--

CREATE SEQUENCE public.movimientos_recursos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.movimientos_recursos_id_seq OWNER TO postgres;

--
-- Tabla: movimientos_recursos - Registro de entradas y salidas de recursos empresariales
--

CREATE TABLE public.movimientos_recursos (
    id integer NOT NULL DEFAULT nextval('public.movimientos_recursos_id_seq'::regclass),
    recurso_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(50) NOT NULL,
    responsable character varying(100),
    observaciones text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_recursos_pkey PRIMARY KEY (id),
    CONSTRAINT movimientos_recursos_cantidad_check CHECK (cantidad > 0),
    CONSTRAINT movimientos_recursos_tipo_check CHECK ((tipo)::text = ANY ((ARRAY['entrada'::character varying, 'salida'::character varying])::text[])),
    CONSTRAINT fk_movimiento_recurso FOREIGN KEY (recurso_id) REFERENCES public.recursos_empresa(id) ON DELETE CASCADE
);

ALTER TABLE public.movimientos_recursos OWNER TO postgres;
ALTER SEQUENCE public.movimientos_recursos_id_seq OWNED BY public.movimientos_recursos.id;

--
-- Datos iniciales para recursos_empresa
--

COPY public.recursos_empresa (id, nombre, categoria, descripcion, numero_serie, marca, modelo, ubicacion, estado, cantidad, fecha_adquisicion, costo_adquisicion, activo) FROM stdin;
1	Impresora Multifuncional	Impresora	Impresora láser multifuncional para oficina	SN-IMP-001	HP	LaserJet Pro M428	Oficina Principal	disponible	2	2024-01-15	8500.00	t
2	Computadora Desktop	Computadora	PC de escritorio para administración	SN-PC-001	Dell	OptiPlex 7090	Recepción	en_uso	1	2024-02-20	15000.00	t
3	Laptop Dell	Computadora	Laptop para trabajo móvil	SN-LAP-001	Dell	Latitude 5520	Almacén	disponible	3	2024-03-10	18000.00	t
4	Monitor 24 Pulgadas	Monitor	Monitor LED Full HD	SN-MON-001	LG	24MK430H	Oficina Principal	en_uso	5	2024-01-20	3500.00	t
5	Scanner Documentos	Scanner	Scanner de alta velocidad para documentos	SN-SCAN-001	Epson	WorkForce ES-580W	Oficina Principal	disponible	1	2024-04-05	6000.00	t
6	Proyector	Equipo Audiovisual	Proyector para presentaciones	SN-PROY-001	BenQ	MH733	Sala de Juntas	disponible	1	2024-05-12	12000.00	t
7	Router WiFi	Red	Router empresarial de alta velocidad	SN-ROUT-001	Cisco	RV340	Cuarto de Servidores	en_uso	2	2024-02-01	4500.00	t
8	UPS Respaldo	Energía	Sistema de respaldo de energía	SN-UPS-001	APC	Smart-UPS 1500	Cuarto de Servidores	en_uso	3	2024-01-10	5500.00	t
9	Silla Ergonómica	Mobiliario	Silla de oficina ergonómica	SN-SILLA-001	Herman Miller	Aeron	Oficina Principal	disponible	10	2024-06-01	8000.00	t
10	Escritorio Ejecutivo	Mobiliario	Escritorio de madera para oficina	SN-ESC-001	Steelcase	Currency	Oficina Principal	en_uso	5	2024-03-15	6500.00	t
\.

SELECT pg_catalog.setval('public.recursos_empresa_id_seq', 10, true);

--
-- Datos iniciales para movimientos_recursos
--

COPY public.movimientos_recursos (id, recurso_id, tipo, cantidad, motivo, responsable, observaciones, fecha) FROM stdin;
1	1	entrada	2	compra_inicial	Admin Sistema	Adquisición inicial de impresoras	2024-01-15 10:00:00
2	2	entrada	1	compra_inicial	Admin Sistema	PC para recepción	2024-02-20 09:00:00
3	3	entrada	5	compra_inicial	Admin Sistema	Laptops para equipo de ventas	2024-03-10 14:00:00
4	3	salida	2	asignacion	Juan Pérez	Asignadas a vendedores nuevos	2024-03-15 11:00:00
5	4	entrada	5	compra_inicial	Admin Sistema	Monitores para oficina	2024-01-20 10:30:00
6	5	entrada	1	compra_inicial	Admin Sistema	Scanner para digitalización	2024-04-05 15:00:00
7	6	entrada	1	compra_inicial	Admin Sistema	Proyector sala de juntas	2024-05-12 09:30:00
8	7	entrada	2	compra_inicial	Admin Sistema	Routers de red	2024-02-01 08:00:00
9	8	entrada	3	compra_inicial	Admin Sistema	UPS para respaldo	2024-01-10 10:00:00
10	9	entrada	10	compra_inicial	Admin Sistema	Sillas ergonómicas	2024-06-01 11:00:00
11	10	entrada	5	compra_inicial	Admin Sistema	Escritorios ejecutivos	2024-03-15 14:30:00
12	1	salida	1	mantenimiento	Soporte TI	Envío a reparación	2025-01-20 09:00:00
13	1	entrada	1	devolucion	Soporte TI	Regreso de reparación	2025-02-05 16:00:00
14	9	salida	2	asignacion	RRHH	Asignadas a nuevos empleados	2025-03-01 10:00:00
\.

SELECT pg_catalog.setval('public.movimientos_recursos_id_seq', 14, true);

-- Completed on 2026-03-18 07:53:53

--
-- PostgreSQL database dump complete
--

\unrestrict MefVwPhQ419P0BrF6iKBNiaHu36uDisMZnzMRxANqekWCXdM3nHXoBdWKJG2GIg

