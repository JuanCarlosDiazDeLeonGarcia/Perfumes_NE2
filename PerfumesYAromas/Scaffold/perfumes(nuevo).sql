--
-- PostgreSQL database dump
--

\restrict AimnVCZ6hvUD9MT5dBia0wAxjT8a8pLJdWXakpBKmQcPRDJPoavKySacKUU4W37

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-03-03 18:34:33

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
-- TOC entry 245 (class 1255 OID 16807)
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
-- TOC entry 234 (class 1259 OID 16600)
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
-- TOC entry 238 (class 1259 OID 16642)
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
-- TOC entry 237 (class 1259 OID 16641)
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
-- TOC entry 5116 (class 0 OID 0)
-- Dependencies: 237
-- Name: carrito_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carrito_items_id_seq OWNED BY public.carrito_items.id;


--
-- TOC entry 236 (class 1259 OID 16625)
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
-- TOC entry 235 (class 1259 OID 16624)
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
-- TOC entry 5117 (class 0 OID 0)
-- Dependencies: 235
-- Name: carritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carritos_id_seq OWNED BY public.carritos.id;


--
-- TOC entry 222 (class 1259 OID 16452)
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
-- TOC entry 221 (class 1259 OID 16451)
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
-- TOC entry 5118 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 226 (class 1259 OID 16493)
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
    CONSTRAINT clientes_estado_cliente_check CHECK (((estado_cliente)::text = ANY ((ARRAY['activo'::character varying, 'inactivo'::character varying])::text[]))),
    CONSTRAINT clientes_etapa_crm_check CHECK (((etapa_crm)::text = ANY ((ARRAY['Prospecto'::character varying, 'Activo'::character varying, 'Frecuente'::character varying, 'Inactivo'::character varying])::text[])))
);


ALTER TABLE public.clientes OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16492)
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
-- TOC entry 5119 (class 0 OID 0)
-- Dependencies: 225
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 233 (class 1259 OID 16599)
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
-- TOC entry 5120 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.detalle_pedidos_id_seq OWNED BY public.carrito.id;


--
-- TOC entry 228 (class 1259 OID 16517)
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
    CONSTRAINT interacciones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['llamada'::character varying, 'correo'::character varying, 'reunion'::character varying, 'whatsapp'::character varying, 'visita'::character varying, 'otro'::character varying])::text[])))
);


ALTER TABLE public.interacciones OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16516)
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
-- TOC entry 5121 (class 0 OID 0)
-- Dependencies: 227
-- Name: interacciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interacciones_id_seq OWNED BY public.interacciones.id;


--
-- TOC entry 230 (class 1259 OID 16548)
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
-- TOC entry 229 (class 1259 OID 16547)
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
-- TOC entry 5122 (class 0 OID 0)
-- Dependencies: 229
-- Name: metricas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metricas_clientes_id_seq OWNED BY public.metricas_clientes.id;


--
-- TOC entry 232 (class 1259 OID 16569)
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
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmado'::character varying, 'procesando'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[]))),
    CONSTRAINT pedidos_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16568)
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
-- TOC entry 5123 (class 0 OID 0)
-- Dependencies: 231
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 224 (class 1259 OID 16467)
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
    CONSTRAINT productos_genero_check CHECK (((genero)::text = ANY ((ARRAY['Hombre'::character varying, 'Mujer'::character varying, 'Unisex'::character varying])::text[]))),
    CONSTRAINT productos_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16466)
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
-- TOC entry 5124 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 242 (class 1259 OID 16679)
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
-- TOC entry 241 (class 1259 OID 16678)
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
-- TOC entry 5125 (class 0 OID 0)
-- Dependencies: 241
-- Name: productos_proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_proveedores_id_seq OWNED BY public.productos_proveedores.id;


--
-- TOC entry 240 (class 1259 OID 16665)
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
-- TOC entry 239 (class 1259 OID 16664)
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
-- TOC entry 5126 (class 0 OID 0)
-- Dependencies: 239
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 244 (class 1259 OID 16735)
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
    CONSTRAINT seguimiento_pedidos_estado_paquete_check CHECK (((estado_paquete)::text = ANY ((ARRAY['en_proceso'::character varying, 'en_transito'::character varying, 'en_reparto'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[])))
);


ALTER TABLE public.seguimiento_pedidos OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 16734)
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
-- TOC entry 5127 (class 0 OID 0)
-- Dependencies: 243
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimiento_pedidos_id_seq OWNED BY public.seguimiento_pedidos.id;


--
-- TOC entry 220 (class 1259 OID 16432)
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
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['admin'::character varying, 'usuario'::character varying, 'vendedor'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16431)
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
-- TOC entry 5128 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4852 (class 2604 OID 16603)
-- Name: carrito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito ALTER COLUMN id SET DEFAULT nextval('public.detalle_pedidos_id_seq'::regclass);


--
-- TOC entry 4857 (class 2604 OID 16645)
-- Name: carrito_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items ALTER COLUMN id SET DEFAULT nextval('public.carrito_items_id_seq'::regclass);


--
-- TOC entry 4854 (class 2604 OID 16628)
-- Name: carritos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos ALTER COLUMN id SET DEFAULT nextval('public.carritos_id_seq'::regclass);


--
-- TOC entry 4821 (class 2604 OID 16455)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4831 (class 2604 OID 16496)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4837 (class 2604 OID 16520)
-- Name: interacciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones ALTER COLUMN id SET DEFAULT nextval('public.interacciones_id_seq'::regclass);


--
-- TOC entry 4840 (class 2604 OID 16551)
-- Name: metricas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes ALTER COLUMN id SET DEFAULT nextval('public.metricas_clientes_id_seq'::regclass);


--
-- TOC entry 4846 (class 2604 OID 16572)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4824 (class 2604 OID 16470)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4862 (class 2604 OID 16682)
-- Name: productos_proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores ALTER COLUMN id SET DEFAULT nextval('public.productos_proveedores_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 16668)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4864 (class 2604 OID 16738)
-- Name: seguimiento_pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos ALTER COLUMN id SET DEFAULT nextval('public.seguimiento_pedidos_id_seq'::regclass);


--
-- TOC entry 4816 (class 2604 OID 16435)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5100 (class 0 OID 16600)
-- Dependencies: 234
-- Data for Name: carrito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal, descuento) FROM stdin;
1	1	10	2	30.00	60.00	0.00
2	1	7	1	38.00	38.00	0.00
3	2	3	3	35.00	105.00	0.00
\.


--
-- TOC entry 5104 (class 0 OID 16642)
-- Dependencies: 238
-- Data for Name: carrito_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito_items (id, carrito_id, producto_id, cantidad, fecha_agregado) FROM stdin;
\.


--
-- TOC entry 5102 (class 0 OID 16625)
-- Dependencies: 236
-- Data for Name: carritos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carritos (id, cliente_id, session_id, fecha_creacion, fecha_actualizacion) FROM stdin;
\.


--
-- TOC entry 5088 (class 0 OID 16452)
-- Dependencies: 222
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
-- TOC entry 5092 (class 0 OID 16493)
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
-- TOC entry 5094 (class 0 OID 16517)
-- Dependencies: 228
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
-- TOC entry 5096 (class 0 OID 16548)
-- Dependencies: 230
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
-- TOC entry 5098 (class 0 OID 16569)
-- Dependencies: 232
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, numero_orden, cliente_id, vendedor_id, producto_id, cantidad, subtotal, impuestos, descuento, total, estado, metodo_pago, direccion_envio, notas, fecha_pedido, fecha_confirmacion, fecha_envio, fecha_entrega) FROM stdin;
1	ORD-001	4	1	10	2	500.00	0.00	0.00	580.00	entregado	tarjeta	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N
2	ORD-002	4	1	7	3	750.00	0.00	0.00	870.00	enviado	transferencia	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N
8	ORD-100	4	1	3	2	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
9	ORD-103	6	6	1	4	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
10	ORD-104	7	6	9	2	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
11	ORD-102	5	6	5	1	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
12	ORD-101	2	6	4	3	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N
13	ORD-105	5	6	10	2	60.00	9.60	0.00	69.60	enviado	tarjeta	\N	\N	2026-03-04 10:00:00.000000	\N	\N	\N
\.


--
-- TOC entry 5090 (class 0 OID 16467)
-- Dependencies: 224
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
13	BLACK ORCHID	Una fragancia seductora con notas oscuras de orquídea negra y especias.	55.00	3	7	6	https://m.media-amazon.com/images/I/41EXXOm0GBL._AC_UF894,1000_QL80_.jpg	Tom Ford	Mujer	100	Orquídea Negra, Especias, Chocolate	t	2026-03-04 10:00:00.000000	2026-03-04 10:00:00.000000	2	pull
\.


--
-- TOC entry 5108 (class 0 OID 16679)
-- Dependencies: 242
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
-- TOC entry 5106 (class 0 OID 16665)
-- Dependencies: 240
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proveedores (id, nombre, contacto, email, telefono, direccion, ciudad, pais, calificacion, activo, fecha_creacion) FROM stdin;
1	Distribuidora Internacional Fragancias	Luis Mendoza	compras@difragancias.com	+52-449-111-2222	\N	Aguascalientes	México	5	t	2026-02-04 21:12:51.404965
2	Importadora Aromas del Mundo	Carmen Vega	ventas@aromasmundo.com	+52-33-3333-4444	\N	Guadalajara	México	4	t	2026-02-04 21:12:51.404965
3	Perfumes Europeos SA de CV	Antonio Ruiz	info@perfumeseur.com	+52-55-5555-6666	\N	Ciudad de México	México	5	t	2026-02-04 21:12:51.404965
4	Distribuidora Internacional Fragancias	Luis Mendoza	compras@difragancias.com	+52-449-111-2222	\N	Aguascalientes	México	5	t	2026-02-16 07:23:30.041368
5	Importadora Aromas del Mundo	Carmen Vega	ventas@aromasmundo.com	+52-33-3333-4444	\N	Guadalajara	México	4	t	2026-02-16 07:23:30.041368
6	Perfumes Europeos SA de CV	Antonio Ruiz	info@perfumeseur.com	+52-55-5555-6666	\N	Ciudad de México	México	5	t	2026-02-16 07:23:30.041368
\.


--
-- TOC entry 5110 (class 0 OID 16735)
-- Dependencies: 244
-- Data for Name: seguimiento_pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seguimiento_pedidos (id, cliente_id, vendedor_id, pedido_id, estado_paquete, fecha_pedido, ubicacion_actual, descripcion, fecha_actualizacion) FROM stdin;
6	2	3	2	en_proceso	2026-02-08 10:30:00	Almacén principal - Preparando envío	Pedido confirmado, empaquetando productos	2026-02-16 07:26:42.194911
7	5	2	2	entregado	2026-01-15 14:00:00	Entregado en domicilio	Pedido entregado exitosamente - Firmado por cliente	2026-02-16 07:26:42.194911
8	6	1	1	en_reparto	2026-02-10 08:00:00	Repartidor - Zona centro Aguascalientes	En ruta de entrega, llegada estimada 12:00 PM	2026-02-16 07:26:42.194911
5	3	1	1	en_transito	2026-02-05 09:00:00	Centro de distribución - Aguascalientes	Paquete en tránsito hacia destino final	2026-02-16 07:26:42.194911
\.


--
-- TOC entry 5086 (class 0 OID 16432)
-- Dependencies: 220
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, rol, telefono, activo, ultimo_login, fecha_creacion, fecha_actualizacion) FROM stdin;
4	Fernando Rangel	fernando@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0004	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
1	Administrador Sistema	admin@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0001	t	2026-02-10 20:18:34.785737	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
2	Juan Carlos Díaz	juan@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0002	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
3	María González	maria@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0003	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
5	Diego Franco	diego@gmail.com	$2b$10$messi1010	admin	496-123-4567	t	2026-03-03 17:37:48.07419	2026-02-10 07:54:48.647442	2026-02-10 07:54:48.647442
6	vendedor	vende@gmail.com	$2b$10$vende22	vendedor	593-523-5323	t	2026-03-03 17:43:10.369934	2026-03-03 17:38:33.963407	2026-03-03 17:38:33.963407
\.


--
-- TOC entry 5129 (class 0 OID 0)
-- Dependencies: 237
-- Name: carrito_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carrito_items_id_seq', 1, false);


--
-- TOC entry 5130 (class 0 OID 0)
-- Dependencies: 235
-- Name: carritos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carritos_id_seq', 1, false);


--
-- TOC entry 5131 (class 0 OID 0)
-- Dependencies: 221
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 6, true);


--
-- TOC entry 5132 (class 0 OID 0)
-- Dependencies: 225
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 10, true);


--
-- TOC entry 5133 (class 0 OID 0)
-- Dependencies: 233
-- Name: detalle_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.detalle_pedidos_id_seq', 3, true);


--
-- TOC entry 5134 (class 0 OID 0)
-- Dependencies: 227
-- Name: interacciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interacciones_id_seq', 10, true);


--
-- TOC entry 5135 (class 0 OID 0)
-- Dependencies: 229
-- Name: metricas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metricas_clientes_id_seq', 18, true);


--
-- TOC entry 5136 (class 0 OID 0)
-- Dependencies: 231
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 13, true);


--
-- TOC entry 5137 (class 0 OID 0)
-- Dependencies: 223
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 13, true);


--
-- TOC entry 5138 (class 0 OID 0)
-- Dependencies: 241
-- Name: productos_proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_proveedores_id_seq', 12, true);


--
-- TOC entry 5139 (class 0 OID 0)
-- Dependencies: 239
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 6, true);


--
-- TOC entry 5140 (class 0 OID 0)
-- Dependencies: 243
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimiento_pedidos_id_seq', 8, true);


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 219
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- TOC entry 4912 (class 2606 OID 16653)
-- Name: carrito_items carrito_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4908 (class 2606 OID 16635)
-- Name: carritos carritos_cliente_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_cliente_id_session_id_key UNIQUE (cliente_id, session_id);


--
-- TOC entry 4910 (class 2606 OID 16633)
-- Name: carritos carritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_pkey PRIMARY KEY (id);


--
-- TOC entry 4886 (class 2606 OID 16465)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 4888 (class 2606 OID 16463)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4892 (class 2606 OID 16510)
-- Name: clientes clientes_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_correo_key UNIQUE (correo);


--
-- TOC entry 4894 (class 2606 OID 16508)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4906 (class 2606 OID 16613)
-- Name: carrito detalle_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4896 (class 2606 OID 16531)
-- Name: interacciones interacciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4898 (class 2606 OID 16562)
-- Name: metricas_clientes metricas_clientes_cliente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_key UNIQUE (cliente_id);


--
-- TOC entry 4900 (class 2606 OID 16560)
-- Name: metricas_clientes metricas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4902 (class 2606 OID 16588)
-- Name: pedidos pedidos_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_numero_orden_key UNIQUE (numero_orden);


--
-- TOC entry 4904 (class 2606 OID 16586)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 16486)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 16686)
-- Name: productos_proveedores productos_proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 16688)
-- Name: productos_proveedores productos_proveedores_producto_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_proveedor_id_key UNIQUE (producto_id, proveedor_id);


--
-- TOC entry 4914 (class 2606 OID 16677)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 16750)
-- Name: seguimiento_pedidos seguimiento_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4882 (class 2606 OID 16450)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 4884 (class 2606 OID 16448)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 16654)
-- Name: carrito_items carrito_items_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos(id) ON DELETE CASCADE;


--
-- TOC entry 4932 (class 2606 OID 16659)
-- Name: carrito_items carrito_items_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items
    ADD CONSTRAINT carrito_items_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4930 (class 2606 OID 16636)
-- Name: carritos carritos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos
    ADD CONSTRAINT carritos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4921 (class 2606 OID 16511)
-- Name: clientes clientes_usuario_registro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_registro_id_fkey FOREIGN KEY (usuario_registro_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4928 (class 2606 OID 16614)
-- Name: carrito detalle_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4929 (class 2606 OID 16619)
-- Name: carrito detalle_pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito
    ADD CONSTRAINT detalle_pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4922 (class 2606 OID 16532)
-- Name: interacciones interacciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4923 (class 2606 OID 16542)
-- Name: interacciones interacciones_producto_mencionado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_producto_mencionado_id_fkey FOREIGN KEY (producto_mencionado_id) REFERENCES public.productos(id);


--
-- TOC entry 4924 (class 2606 OID 16537)
-- Name: interacciones interacciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 4925 (class 2606 OID 16563)
-- Name: metricas_clientes metricas_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4926 (class 2606 OID 16589)
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 4927 (class 2606 OID 16594)
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);

--
-- Name: pedidos pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 4933 (class 2606 OID 16689)
-- Name: productos_proveedores productos_proveedores_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 4934 (class 2606 OID 16694)
-- Name: productos_proveedores productos_proveedores_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- TOC entry 4935 (class 2606 OID 16751)
-- Name: seguimiento_pedidos seguimiento_pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 4936 (class 2606 OID 16761)
-- Name: seguimiento_pedidos seguimiento_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 4937 (class 2606 OID 16756)
-- Name: seguimiento_pedidos seguimiento_pedidos_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


-- Completed on 2026-03-03 18:34:33

--
-- PostgreSQL database dump complete
--

\unrestrict AimnVCZ6hvUD9MT5dBia0wAxjT8a8pLJdWXakpBKmQcPRDJPoavKySacKUU4W37

