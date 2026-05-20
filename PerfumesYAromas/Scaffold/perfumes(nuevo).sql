--
-- PostgreSQL database dump
--

\restrict 1fTvWayM2ZV8CL3ZtlZBpVRgQrUe29YeHJRsjc2Upw6pgdJiuivQljPGkE9B1tF

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2026-05-19 19:28:29

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
-- TOC entry 266 (class 1255 OID 33165)
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
-- TOC entry 252 (class 1259 OID 41795)
-- Name: carrito_items_persistentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carrito_items_persistentes (
    id integer NOT NULL,
    carrito_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    fecha_agregado timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT carrito_items_persistentes_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.carrito_items_persistentes OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 41794)
-- Name: carrito_items_persistentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carrito_items_persistentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carrito_items_persistentes_id_seq OWNER TO postgres;

--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 251
-- Name: carrito_items_persistentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carrito_items_persistentes_id_seq OWNED BY public.carrito_items_persistentes.id;


--
-- TOC entry 250 (class 1259 OID 41778)
-- Name: carritos_persistentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carritos_persistentes (
    id integer NOT NULL,
    cliente_id integer,
    session_id character varying(255),
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.carritos_persistentes OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 41777)
-- Name: carritos_persistentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carritos_persistentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carritos_persistentes_id_seq OWNER TO postgres;

--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 249
-- Name: carritos_persistentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carritos_persistentes_id_seq OWNED BY public.carritos_persistentes.id;


--
-- TOC entry 219 (class 1259 OID 33194)
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
-- TOC entry 220 (class 1259 OID 33203)
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
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 220
-- Name: categorias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categorias_id_seq OWNED BY public.categorias.id;


--
-- TOC entry 221 (class 1259 OID 33204)
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
-- TOC entry 222 (class 1259 OID 33219)
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
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 222
-- Name: clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clientes_id_seq OWNED BY public.clientes.id;


--
-- TOC entry 258 (class 1259 OID 41866)
-- Name: configuracion_global; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.configuracion_global (
    id integer NOT NULL,
    clave character varying(50) NOT NULL,
    valor text NOT NULL,
    descripcion text,
    actualizado_por integer,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.configuracion_global OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 41865)
-- Name: configuracion_global_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.configuracion_global_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_global_id_seq OWNER TO postgres;

--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 257
-- Name: configuracion_global_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.configuracion_global_id_seq OWNED BY public.configuracion_global.id;


--
-- TOC entry 260 (class 1259 OID 41899)
-- Name: cupones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cupones (
    id integer NOT NULL,
    codigo character varying(50) NOT NULL,
    descripcion text,
    tipo character varying(20) NOT NULL,
    valor numeric(10,2) DEFAULT 0 NOT NULL,
    minimo_compra numeric(10,2) DEFAULT 0,
    usos_maximos integer,
    usos_actuales integer DEFAULT 0,
    activo boolean DEFAULT true,
    fecha_inicio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_fin timestamp without time zone,
    creado_por integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cupones_porcentaje_max CHECK ((((tipo)::text <> 'porcentaje'::text) OR (valor <= (100)::numeric))),
    CONSTRAINT cupones_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['porcentaje'::character varying, 'monto_fijo'::character varying, 'envio_gratis'::character varying])::text[]))),
    CONSTRAINT cupones_valor_check CHECK ((valor >= (0)::numeric))
);


ALTER TABLE public.cupones OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 41898)
-- Name: cupones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cupones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cupones_id_seq OWNER TO postgres;

--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 259
-- Name: cupones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cupones_id_seq OWNED BY public.cupones.id;


--
-- TOC entry 265 (class 1259 OID 42039)
-- Name: datos_fiscales_clientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.datos_fiscales_clientes (
    cliente_id integer NOT NULL,
    rfc character varying(13) NOT NULL,
    nombre_fiscal character varying(200) NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT datos_fiscales_clientes_rfc_len CHECK ((char_length((rfc)::text) = 13))
);


ALTER TABLE public.datos_fiscales_clientes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 33221)
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
-- TOC entry 224 (class 1259 OID 33233)
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
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 224
-- Name: interacciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.interacciones_id_seq OWNED BY public.interacciones.id;


--
-- TOC entry 254 (class 1259 OID 41818)
-- Name: metodos_pago; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metodos_pago (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion text,
    activo boolean DEFAULT true,
    comision_porcentaje numeric(5,2) DEFAULT 0,
    orden integer DEFAULT 0
);


ALTER TABLE public.metodos_pago OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 41817)
-- Name: metodos_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.metodos_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.metodos_pago_id_seq OWNER TO postgres;

--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 253
-- Name: metodos_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metodos_pago_id_seq OWNED BY public.metodos_pago.id;


--
-- TOC entry 225 (class 1259 OID 33234)
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
-- TOC entry 226 (class 1259 OID 33244)
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
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 226
-- Name: metricas_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.metricas_clientes_id_seq OWNED BY public.metricas_clientes.id;


--
-- TOC entry 227 (class 1259 OID 33245)
-- Name: movimientos_inventario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_inventario (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    tipo character varying(200) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(200) NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_inventario_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_inventario_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('entrada'::character varying)::text, ('salida'::character varying)::text])))
);


ALTER TABLE public.movimientos_inventario OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 33256)
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
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 228
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_inventario_id_seq OWNED BY public.movimientos_inventario.id;


--
-- TOC entry 244 (class 1259 OID 33509)
-- Name: movimientos_recursos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.movimientos_recursos (
    id integer NOT NULL,
    recurso_id integer NOT NULL,
    tipo character varying(10) NOT NULL,
    cantidad integer NOT NULL,
    motivo character varying(50) NOT NULL,
    responsable character varying(100),
    observaciones text,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT movimientos_recursos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT movimientos_recursos_tipo_check CHECK (((tipo)::text = ANY (ARRAY[('entrada'::character varying)::text, ('salida'::character varying)::text])))
);


ALTER TABLE public.movimientos_recursos OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 33508)
-- Name: movimientos_recursos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
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
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 243
-- Name: movimientos_recursos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.movimientos_recursos_id_seq OWNED BY public.movimientos_recursos.id;


--
-- TOC entry 229 (class 1259 OID 33257)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    numero_orden character varying(500) NOT NULL,
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
    iva_porcentaje numeric(5,2) DEFAULT 16.00,
    iva_valor numeric(10,2) DEFAULT 0,
    CONSTRAINT pedidos_cantidad_check CHECK ((cantidad > 0)),
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('confirmado'::character varying)::text, ('procesando'::character varying)::text, ('enviado'::character varying)::text, ('entregado'::character varying)::text, ('cancelado'::character varying)::text])))
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 262 (class 1259 OID 41982)
-- Name: pedidos_cabecera; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos_cabecera (
    id integer NOT NULL,
    numero_orden character varying(500) NOT NULL,
    cliente_id integer,
    vendedor_id integer,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    metodo_pago character varying(50),
    direccion_envio text,
    notas text,
    subtotal_total numeric(10,2) DEFAULT 0,
    impuestos_total numeric(10,2) DEFAULT 0,
    descuento_total numeric(10,2) DEFAULT 0,
    total_total numeric(10,2) NOT NULL,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_confirmacion timestamp without time zone,
    fecha_envio timestamp without time zone,
    fecha_entrega timestamp without time zone,
    CONSTRAINT pedidos_cabecera_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'confirmado'::character varying, 'procesando'::character varying, 'enviado'::character varying, 'entregado'::character varying, 'cancelado'::character varying])::text[])))
);


ALTER TABLE public.pedidos_cabecera OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 41981)
-- Name: pedidos_cabecera_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_cabecera_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_cabecera_id_seq OWNER TO postgres;

--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 261
-- Name: pedidos_cabecera_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_cabecera_id_seq OWNED BY public.pedidos_cabecera.id;


--
-- TOC entry 264 (class 1259 OID 42012)
-- Name: pedidos_detalle; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos_detalle (
    id integer NOT NULL,
    pedido_id integer,
    producto_id integer,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    impuestos numeric(10,2) DEFAULT 0,
    descuento numeric(10,2) DEFAULT 0,
    total numeric(10,2) NOT NULL,
    CONSTRAINT pedidos_detalle_cantidad_check CHECK ((cantidad > 0))
);


ALTER TABLE public.pedidos_detalle OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 42011)
-- Name: pedidos_detalle_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_detalle_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_detalle_id_seq OWNER TO postgres;

--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 263
-- Name: pedidos_detalle_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_detalle_id_seq OWNED BY public.pedidos_detalle.id;


--
-- TOC entry 230 (class 1259 OID 33274)
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
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 230
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 231 (class 1259 OID 33275)
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
    iva_porcentaje numeric(5,2) DEFAULT 16.00,
    CONSTRAINT productos_genero_check CHECK (((genero)::text = ANY (ARRAY[('Hombre'::character varying)::text, ('Mujer'::character varying)::text, ('Unisex'::character varying)::text]))),
    CONSTRAINT productos_precio_check CHECK ((precio >= (0)::numeric)),
    CONSTRAINT productos_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.productos OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 33293)
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
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 232
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- TOC entry 233 (class 1259 OID 33294)
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
-- TOC entry 234 (class 1259 OID 33299)
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
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 234
-- Name: productos_proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.productos_proveedores_id_seq OWNED BY public.productos_proveedores.id;


--
-- TOC entry 235 (class 1259 OID 33300)
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
-- TOC entry 236 (class 1259 OID 33310)
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
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 236
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- TOC entry 242 (class 1259 OID 33491)
-- Name: recursos_empresa; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recursos_empresa (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    categoria character varying(50) NOT NULL,
    descripcion text,
    numero_serie character varying(100),
    marca character varying(50),
    modelo character varying(50),
    ubicacion character varying(100),
    estado character varying(20) DEFAULT 'disponible'::character varying,
    cantidad integer DEFAULT 1,
    fecha_adquisicion date,
    costo_adquisicion numeric(12,2),
    activo boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT recursos_empresa_estado_check CHECK (((estado)::text = ANY (ARRAY[('disponible'::character varying)::text, ('en_uso'::character varying)::text, ('mantenimiento'::character varying)::text, ('baja'::character varying)::text])))
);


ALTER TABLE public.recursos_empresa OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 33490)
-- Name: recursos_empresa_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.recursos_empresa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.recursos_empresa_id_seq OWNER TO postgres;

--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 241
-- Name: recursos_empresa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.recursos_empresa_id_seq OWNED BY public.recursos_empresa.id;


--
-- TOC entry 248 (class 1259 OID 33566)
-- Name: respuestas_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respuestas_tickets (
    id integer NOT NULL,
    ticket_id integer,
    remitente_type character varying(20) NOT NULL,
    remitente_id integer NOT NULL,
    mensaje text NOT NULL,
    fecha timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.respuestas_tickets OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 33565)
-- Name: respuestas_tickets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.respuestas_tickets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.respuestas_tickets_id_seq OWNER TO postgres;

--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 247
-- Name: respuestas_tickets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.respuestas_tickets_id_seq OWNED BY public.respuestas_tickets.id;


--
-- TOC entry 237 (class 1259 OID 33311)
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
-- TOC entry 238 (class 1259 OID 33324)
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
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 238
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seguimiento_pedidos_id_seq OWNED BY public.seguimiento_pedidos.id;


--
-- TOC entry 256 (class 1259 OID 41834)
-- Name: tarjetas_credito; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tarjetas_credito (
    id integer NOT NULL,
    cliente_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    titular character varying(150) NOT NULL,
    numero character varying(20) NOT NULL,
    expiracion date NOT NULL,
    cvv character varying(4) NOT NULL,
    principal boolean DEFAULT false,
    activa boolean DEFAULT true,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tarjetas_credito OWNER TO postgres;

--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 256
-- Name: TABLE tarjetas_credito; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.tarjetas_credito IS 'Tarjetas de crédito/débito registradas por clientes';


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 256
-- Name: COLUMN tarjetas_credito.numero; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.tarjetas_credito.numero IS 'Número de tarjeta (enmascarado en UI, solo últimos 4 dígitos visibles)';


--
-- TOC entry 255 (class 1259 OID 41833)
-- Name: tarjetas_credito_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tarjetas_credito_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tarjetas_credito_id_seq OWNER TO postgres;

--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 255
-- Name: tarjetas_credito_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tarjetas_credito_id_seq OWNED BY public.tarjetas_credito.id;


--
-- TOC entry 246 (class 1259 OID 33532)
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    num_ticket integer NOT NULL,
    vendedor integer NOT NULL,
    cliente integer NOT NULL,
    asunto character varying(100) NOT NULL,
    mensaje character varying(500) NOT NULL,
    pedido integer,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'abierto'::character varying,
    prioridad character varying(20) DEFAULT 'media'::character varying,
    categoria character varying(50),
    vendedor_respuesta text,
    fecha_respuesta timestamp without time zone,
    cliente_respuesta text,
    fecha_cierre timestamp without time zone,
    calificacion integer,
    CONSTRAINT tickets_calificacion_check CHECK (((calificacion >= 1) AND (calificacion <= 5)))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 33531)
-- Name: tickets_num_ticket_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tickets_num_ticket_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tickets_num_ticket_seq OWNER TO postgres;

--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 245
-- Name: tickets_num_ticket_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tickets_num_ticket_seq OWNED BY public.tickets.num_ticket;


--
-- TOC entry 239 (class 1259 OID 33325)
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
-- TOC entry 240 (class 1259 OID 33338)
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
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 240
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 4939 (class 2604 OID 41798)
-- Name: carrito_items_persistentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items_persistentes ALTER COLUMN id SET DEFAULT nextval('public.carrito_items_persistentes_id_seq'::regclass);


--
-- TOC entry 4936 (class 2604 OID 41781)
-- Name: carritos_persistentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos_persistentes ALTER COLUMN id SET DEFAULT nextval('public.carritos_persistentes_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 33342)
-- Name: categorias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias ALTER COLUMN id SET DEFAULT nextval('public.categorias_id_seq'::regclass);


--
-- TOC entry 4873 (class 2604 OID 33343)
-- Name: clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes ALTER COLUMN id SET DEFAULT nextval('public.clientes_id_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 41869)
-- Name: configuracion_global id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_global ALTER COLUMN id SET DEFAULT nextval('public.configuracion_global_id_seq'::regclass);


--
-- TOC entry 4952 (class 2604 OID 41902)
-- Name: cupones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupones ALTER COLUMN id SET DEFAULT nextval('public.cupones_id_seq'::regclass);


--
-- TOC entry 4879 (class 2604 OID 33344)
-- Name: interacciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones ALTER COLUMN id SET DEFAULT nextval('public.interacciones_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 41821)
-- Name: metodos_pago id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago ALTER COLUMN id SET DEFAULT nextval('public.metodos_pago_id_seq'::regclass);


--
-- TOC entry 4882 (class 2604 OID 33345)
-- Name: metricas_clientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes ALTER COLUMN id SET DEFAULT nextval('public.metricas_clientes_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 33346)
-- Name: movimientos_inventario id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario ALTER COLUMN id SET DEFAULT nextval('public.movimientos_inventario_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 33512)
-- Name: movimientos_recursos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_recursos ALTER COLUMN id SET DEFAULT nextval('public.movimientos_recursos_id_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 33347)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4959 (class 2604 OID 41985)
-- Name: pedidos_cabecera id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_cabecera ALTER COLUMN id SET DEFAULT nextval('public.pedidos_cabecera_id_seq'::regclass);


--
-- TOC entry 4965 (class 2604 OID 42015)
-- Name: pedidos_detalle id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_detalle ALTER COLUMN id SET DEFAULT nextval('public.pedidos_detalle_id_seq'::regclass);


--
-- TOC entry 4899 (class 2604 OID 33348)
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- TOC entry 4907 (class 2604 OID 33349)
-- Name: productos_proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores ALTER COLUMN id SET DEFAULT nextval('public.productos_proveedores_id_seq'::regclass);


--
-- TOC entry 4909 (class 2604 OID 33350)
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- TOC entry 4921 (class 2604 OID 33494)
-- Name: recursos_empresa id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos_empresa ALTER COLUMN id SET DEFAULT nextval('public.recursos_empresa_id_seq'::regclass);


--
-- TOC entry 4934 (class 2604 OID 33569)
-- Name: respuestas_tickets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuestas_tickets ALTER COLUMN id SET DEFAULT nextval('public.respuestas_tickets_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 33351)
-- Name: seguimiento_pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos ALTER COLUMN id SET DEFAULT nextval('public.seguimiento_pedidos_id_seq'::regclass);


--
-- TOC entry 4945 (class 2604 OID 41837)
-- Name: tarjetas_credito id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjetas_credito ALTER COLUMN id SET DEFAULT nextval('public.tarjetas_credito_id_seq'::regclass);


--
-- TOC entry 4929 (class 2604 OID 33535)
-- Name: tickets num_ticket; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets ALTER COLUMN num_ticket SET DEFAULT nextval('public.tickets_num_ticket_seq'::regclass);


--
-- TOC entry 4916 (class 2604 OID 33352)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 5277 (class 0 OID 41795)
-- Dependencies: 252
-- Data for Name: carrito_items_persistentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carrito_items_persistentes (id, carrito_id, producto_id, cantidad, precio_unitario, fecha_agregado) FROM stdin;
\.


--
-- TOC entry 5275 (class 0 OID 41778)
-- Dependencies: 250
-- Data for Name: carritos_persistentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carritos_persistentes (id, cliente_id, session_id, fecha_creacion, fecha_actualizacion) FROM stdin;
2	9	\N	2026-04-07 07:27:10.540031	2026-05-18 12:46:19.158382
7	11	\N	2026-05-19 07:46:32.139579	2026-05-19 07:48:21.953584
6	\N	session_1775567711978_hjh0rrrkl	2026-05-19 06:53:36.486078	2026-05-19 07:48:21.97111
\.


--
-- TOC entry 5244 (class 0 OID 33194)
-- Dependencies: 219
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
-- TOC entry 5246 (class 0 OID 33204)
-- Dependencies: 221
-- Data for Name: clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clientes (id, nombre, correo, telefono, empresa, direccion, ciudad, estado, codigo_postal, fecha_registro, estado_cliente, etapa_crm, notas, fecha_nacimiento, genero, usuario_registro_id, fecha_actualizacion, password) FROM stdin;
4	Laura Ramírez Torres	laura.ramirez@yahoo.com	449-456-7890	Tienda Fashion Boutique	Av. Hidalgo 321	Zacatecas	Zacatecas	98000	2026-02-04 21:12:51.404965	inactivo	Inactivo	\N	\N	\N	1	2026-02-04 21:12:51.404965	10
5	Nestor Rangel Reyes	nestor.rangel@gmail.com	449-512-8713	Almacenes Lujo Total	Av. Universidad 654	Aguascalientes	Aguascalientes	20200	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
6	Sofía Bueno Ruiz	sofia.bueno@gmail.com	449-678-9012	\N	Calle Juárez 987	Aguascalientes	Aguascalientes	20300	2026-02-04 21:12:51.404965	activo	Frecuente	\N	\N	\N	3	2026-02-04 21:12:51.404965	10
7	Miguel Ángel Flores	miguel.flores@hotmail.com	449-789-0123	Perfumes y Más	Av. Carranza 147	San Luis Potosí	San Luis Potosí	78000	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
8	Mariana Torres Díaz	mariana.torres@outlook.com	449-890-1234	\N	Calle Allende 258	Aguascalientes	Aguascalientes	20400	2026-02-04 21:12:51.404965	activo	Prospecto	\N	\N	\N	1	2026-02-04 21:12:51.404965	10
2	Ana Laura Sáncho	ana.sanchez@outlook.com	449-234-5678	Boutique Aromas del Valle	Blvd. Adolfo López Mateos 456	León	Guanajuato	37000	2026-02-04 21:12:51.404965	activo	Activo	\N	\N	Femenino	2	2026-02-10 06:52:27.728211	10
10	Juan	odis@hotmail.com	4935825356aa	\N	\N	\N	\N	\N	2026-02-10 07:49:15.597903	activo	Prospecto	\N	\N	Masculino	\N	2026-02-10 07:51:24.402078	odis22
1	Diego Franco Escobedo	diego.franco@gmail.com	449-123-4567	Perfumería Elegancia	Av. Constitución 123	Aguascalientes	Aguascalientes	20000	2026-02-04 21:12:51.404965	activo	Frecuente	\N	\N	\N	2	2026-02-04 21:12:51.404965	10
3	Cristian Moreno Ovalle	cristian.moreno@hotmail.com	449-345-6789	Distribuidora Fragancias SA	Calle Madero 789	Aguascalientes	Aguascalientes	20100	2026-02-04 21:12:51.404965	activo	Prospecto	\N	\N	\N	3	2026-02-04 21:12:51.404965	10
9	Hola	22151235@aguascalientes.tecnm.mx	321082190123	\N	hola 32	hola	hola	40918	2026-02-09 23:12:58.245782	activo	Prospecto	\N	\N	Otro	\N	2026-05-19 06:54:18.281544	holahola
11	Cynthia	cynthia@email.com	4829582747	\N	calle	ciudad	estaddo	59823	2026-05-19 07:46:08.385142	activo	Prospecto	\N	2026-05-13	Femenino	\N	2026-05-19 17:02:20.347385	hola123
\.


--
-- TOC entry 5283 (class 0 OID 41866)
-- Dependencies: 258
-- Data for Name: configuracion_global; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.configuracion_global (id, clave, valor, descripcion, actualizado_por, fecha_actualizacion) FROM stdin;
1	iva_porcentaje	9	Porcentaje de IVA aplicado a las ventas	7	2026-04-16 07:51:41.327335
\.


--
-- TOC entry 5285 (class 0 OID 41899)
-- Dependencies: 260
-- Data for Name: cupones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cupones (id, codigo, descripcion, tipo, valor, minimo_compra, usos_maximos, usos_actuales, activo, fecha_inicio, fecha_fin, creado_por, fecha_creacion) FROM stdin;
3	ENVIOGRATIS	Envío gratuito en cualquier compra	envio_gratis	0.00	0.00	200	0	t	2026-04-15 19:13:33.966743	\N	1	2026-04-15 19:13:33.966743
2	DESCUENTO50	$50 pesos de descuento en compras mayores a $200	monto_fijo	50.00	0.00	50	0	t	2026-04-15 19:13:33.966743	\N	1	2026-04-15 19:13:33.966743
5	VIPCLIENTE	$100 pesos para clientes VIP	monto_fijo	80.00	0.00	10	0	t	2026-04-15 19:13:33.966743	\N	1	2026-04-15 19:13:33.966743
4	PROMO20	20% de descuento especial de temporada	porcentaje	20.00	0.00	30	4	t	2026-04-15 19:13:33.966743	2026-12-31 23:59:59	1	2026-04-15 19:13:33.966743
1	BIENVENIDO10	10% de descuento en tu primera compra	porcentaje	10.00	0.00	100	5	t	2026-04-15 19:13:33.966743	\N	1	2026-04-15 19:13:33.966743
\.


--
-- TOC entry 5290 (class 0 OID 42039)
-- Dependencies: 265
-- Data for Name: datos_fiscales_clientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.datos_fiscales_clientes (cliente_id, rfc, nombre_fiscal, fecha_creacion, fecha_actualizacion) FROM stdin;
11	40I333333W9ER	Cynthia	2026-05-19 17:03:05.633517	2026-05-19 17:03:10.838918
\.


--
-- TOC entry 5248 (class 0 OID 33221)
-- Dependencies: 223
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
-- TOC entry 5279 (class 0 OID 41818)
-- Dependencies: 254
-- Data for Name: metodos_pago; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metodos_pago (id, nombre, descripcion, activo, comision_porcentaje, orden) FROM stdin;
1	Tarjeta de Crédito/Débito	Pago seguro con tarjeta	t	0.00	1
2	Transferencia Bancaria	Pago por transferencia SPEI	t	0.00	2
3	Efectivo	Pago contra entrega	t	0.00	3
4	Monedero Digital	Pago con saldo de monedero	t	0.00	4
\.


--
-- TOC entry 5250 (class 0 OID 33234)
-- Dependencies: 225
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
19	11	0	\N	\N	0	0.00	0.00	\N	2026-05-19 07:46:08.436585
\.


--
-- TOC entry 5252 (class 0 OID 33245)
-- Dependencies: 227
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
15	4	salida	3	Venta desde catálogo	2026-04-07 07:37:31.274341
16	4	salida	6	Venta desde catálogo	2026-04-08 07:19:29.973407
21	4	salida	7	Venta desde catálogo	2026-04-08 07:25:46.565498
26	5	salida	12	Venta desde catálogo	2026-04-08 08:54:49.912466
37	4	salida	9	Venta desde catálogo	2026-04-08 09:25:36.692393
38	4	entrada	8	Restock automático (push) - stock mínimo alcanzado	2026-04-08 09:25:36.692393
39	13	salida	4	Venta desde catálogo	2026-04-09 07:12:52.164253
40	13	salida	2	Venta desde catálogo	2026-04-09 07:25:55.342172
60	9	salida	3	Venta desde catálogo	2026-04-15 20:05:39.010619
61	5	salida	2	Venta desde catálogo	2026-04-15 20:05:39.010619
62	15	salida	4	Venta desde catálogo	2026-04-15 20:23:29.665783
63	15	entrada	3	Restock automático (push) - stock mínimo alcanzado	2026-04-15 20:23:29.665783
64	13	salida	4	Venta desde catálogo	2026-04-15 20:23:29.665783
65	6	salida	2	Venta desde catálogo	2026-04-15 20:54:35.405956
66	9	salida	1	Venta desde catálogo	2026-04-15 20:54:35.405956
67	9	salida	1	Venta desde catálogo	2026-04-15 21:09:19.323798
68	5	salida	2	Venta desde catálogo	2026-04-15 21:09:19.323798
69	9	salida	1	Venta desde catálogo	2026-04-15 21:34:07.481913
70	5	salida	1	Venta desde catálogo	2026-04-15 21:34:07.481913
71	3	salida	3	Venta desde catálogo	2026-04-15 21:47:17.44406
72	6	salida	4	Venta desde catálogo	2026-04-15 21:47:17.44406
73	6	salida	1	Venta desde catálogo	2026-04-15 22:15:02.181296
74	9	salida	2	Venta desde catálogo	2026-04-15 22:15:02.181296
75	13	salida	1	Venta desde catálogo	2026-04-16 07:20:51.377484
76	9	salida	1	Venta desde catálogo	2026-04-16 07:23:52.542056
77	13	salida	1	Venta desde catálogo	2026-04-16 07:24:42.164228
78	9	salida	3	Venta desde catálogo	2026-04-16 07:41:39.300467
79	5	salida	2	Venta desde catálogo	2026-04-16 07:41:39.300467
80	5	salida	2	Venta desde catálogo	2026-05-18 12:46:18.981464
81	5	salida	5	Venta desde catálogo	2026-05-19 07:48:21.808842
\.


--
-- TOC entry 5269 (class 0 OID 33509)
-- Dependencies: 244
-- Data for Name: movimientos_recursos; Type: TABLE DATA; Schema: public; Owner: postgres
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


--
-- TOC entry 5254 (class 0 OID 33257)
-- Dependencies: 229
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, numero_orden, cliente_id, vendedor_id, producto_id, cantidad, subtotal, impuestos, descuento, total, estado, metodo_pago, direccion_envio, notas, fecha_pedido, fecha_confirmacion, fecha_envio, fecha_entrega, iva_porcentaje, iva_valor) FROM stdin;
12	ORD-101	2	6	4	3	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N	16.00	0.00
9	ORD-103	6	6	1	4	500.00	0.00	0.00	580.00	entregado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:19:13.055228	16.00	0.00
10	ORD-104	7	6	9	2	500.00	0.00	0.00	580.00	entregado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:20:20.611367	16.00	0.00
14	P1773293241529	8	6	13	5	275.00	0.00	0.00	275.00	pendiente	tarjeta	Una ciudad	correr	2026-03-11 23:27:21.530264	\N	\N	\N	16.00	0.00
13	ORD-105	5	6	10	2	60.00	0.00	0.00	60.00	pendiente	tarjeta			2026-03-04 10:00:00	\N	\N	\N	16.00	0.00
15	ORD-119	1	6	1	1	60.00	0.00	0.00	70.00	entregado	efectivo	SI	No	2026-03-26 07:14:56.433281	\N	2026-03-26 07:15:10.88566	2026-03-26 07:15:24.489507	16.00	0.00
34	PED-1776305139020-a8f8bdd0	9	6	9	3	102.00	16.32	0.00	118.32	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:05:39.010619	\N	\N	\N	16.00	0.00
36	PED-1776306209673-9d4edf7d	9	6	15	4	280.00	44.80	0.00	324.80	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:23:29.665783	\N	\N	\N	16.00	0.00
37	PED-1776306209673-9d4edf7d	9	6	13	4	220.00	35.20	0.00	255.20	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:23:29.665783	\N	\N	\N	16.00	0.00
38	PED-1776308075419-c0dc73b9	9	6	6	2	60.00	9.60	0.00	69.60	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:54:35.405956	\N	\N	\N	16.00	0.00
39	PED-1776308075419-c0dc73b9	9	6	9	1	34.00	5.44	0.00	39.44	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:54:35.405956	\N	\N	\N	16.00	0.00
40	PED-1776308959340-20f18dd9	9	6	9	1	34.00	5.44	0.00	39.44	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:09:19.323798	\N	\N	\N	16.00	0.00
42	PED-1776310447491-e727a5b9	9	6	9	1	34.00	5.44	6.20	33.24	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:34:07.481913	\N	\N	\N	16.00	0.00
44	PED-1776311237458-25c79512	9	6	3	3	105.00	16.80	45.00	76.80	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:47:17.44406	\N	\N	\N	16.00	0.00
45	PED-1776311237458-25c79512	9	6	6	4	120.00	19.20	45.00	139.20	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:47:17.44406	\N	\N	\N	16.00	0.00
46	PED-1776312902196-6a6b3a14	9	6	6	1	30.00	4.20	25.60	8.60	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 22:15:02.181296	\N	\N	\N	14.00	4.20
47	PED-1776312902196-6a6b3a14	9	6	9	2	68.00	9.52	25.60	51.92	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 22:15:02.181296	\N	\N	\N	14.00	9.52
48	PED-1776345651391-d854493d	9	6	13	1	55.00	7.70	0.00	62.70	pendiente	👛 Monedero Digital	hola 32	\N	2026-04-16 07:20:51.377484	\N	\N	\N	14.00	7.70
49	PED-1776345832546-80d27c34	9	6	9	1	34.00	4.76	0.00	38.76	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-16 07:23:52.542056	\N	\N	\N	14.00	4.76
50	PED-1776345882171-822e15bf	9	6	13	1	55.00	7.70	0.00	62.70	pendiente	🏦 Transferencia Bancaria	hola 32	\N	2026-04-16 07:24:42.164228	\N	\N	\N	14.00	7.70
51	PED-1776346899310-3b781adb	9	6	9	3	102.00	14.28	15.80	100.48	confirmado	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-16 07:41:39.300467	2026-04-16 07:47:22.981352	\N	\N	14.00	14.28
1	ORD-001	4	6	10	2	500.00	0.00	0.00	580.00	entregado	tarjeta	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N	16.00	0.00
2	ORD-002	4	6	7	3	750.00	0.00	0.00	870.00	enviado	transferencia	\N	\N	2026-02-04 23:12:52.147103	\N	\N	\N	16.00	0.00
8	ORD-100	4	6	3	2	500.00	0.00	0.00	580.00	confirmado	\N	\N	\N	2026-02-16 07:57:24.117768	\N	\N	\N	16.00	0.00
35	PED-1776305139020-a8f8bdd0	9	6	5	2	56.00	8.96	0.00	64.96	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 20:05:39.010619	\N	\N	\N	16.00	0.00
41	PED-1776308959340-20f18dd9	9	6	5	2	56.00	8.96	0.00	64.96	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:09:19.323798	\N	\N	\N	16.00	0.00
43	PED-1776310447491-e727a5b9	9	6	5	1	28.00	4.48	6.20	32.48	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-15 21:34:07.481913	\N	\N	\N	16.00	0.00
52	PED-1776346899310-3b781adb	9	6	5	2	56.00	7.84	15.80	48.04	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-04-16 07:41:39.300467	\N	\N	\N	14.00	7.84
53	PED-1779129978995-7b518dd7	9	6	5	2	56.00	5.04	0.00	61.04	pendiente	💳 Tarjeta de Crédito/Débito	hola 32	\N	2026-05-18 12:46:18.981464	\N	\N	\N	9.00	5.04
54	PED-1779198501821-6cf50ba4	11	6	5	5	140.00	12.60	0.00	152.60	procesando	💳 Tarjeta de Crédito/Débito	calle	\N	2026-05-19 07:48:21.808842	2026-05-19 07:53:06.666879	\N	\N	9.00	12.60
\.


--
-- TOC entry 5287 (class 0 OID 41982)
-- Dependencies: 262
-- Data for Name: pedidos_cabecera; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos_cabecera (id, numero_orden, cliente_id, vendedor_id, estado, metodo_pago, direccion_envio, notas, subtotal_total, impuestos_total, descuento_total, total_total, fecha_pedido, fecha_confirmacion, fecha_envio, fecha_entrega) FROM stdin;
4	ORD-101	2	6	confirmado	\N	\N	\N	500.00	0.00	0.00	580.00	2026-02-16 07:57:24.117768	\N	\N	\N
5	ORD-103	6	6	entregado	\N	\N	\N	500.00	0.00	0.00	580.00	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:19:13.055228
6	ORD-104	7	6	entregado	\N	\N	\N	500.00	0.00	0.00	580.00	2026-02-16 07:57:24.117768	\N	\N	2026-03-04 23:20:20.611367
7	ORD-105	5	6	pendiente	tarjeta			60.00	0.00	0.00	60.00	2026-03-04 10:00:00	\N	\N	\N
8	ORD-119	1	6	entregado	efectivo	SI	No	60.00	0.00	0.00	70.00	2026-03-26 07:14:56.433281	\N	2026-03-26 07:15:10.88566	2026-03-26 07:15:24.489507
9	P1773293241529	8	6	pendiente	tarjeta	Una ciudad	correr	275.00	0.00	0.00	275.00	2026-03-11 23:27:21.530264	\N	\N	\N
1	ORD-001	4	6	entregado	tarjeta	\N	\N	500.00	0.00	0.00	580.00	2026-02-04 23:12:52.147103	\N	\N	\N
2	ORD-002	4	6	enviado	transferencia	\N	\N	750.00	0.00	0.00	870.00	2026-02-04 23:12:52.147103	\N	\N	\N
3	ORD-100	4	6	confirmado	\N	\N	\N	500.00	0.00	0.00	580.00	2026-02-16 07:57:24.117768	\N	\N	\N
\.


--
-- TOC entry 5289 (class 0 OID 42012)
-- Dependencies: 264
-- Data for Name: pedidos_detalle; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos_detalle (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal, impuestos, descuento, total) FROM stdin;
1	1	10	2	290.00	500.00	0.00	0.00	580.00
2	2	7	3	290.00	750.00	0.00	0.00	870.00
3	3	3	2	290.00	500.00	0.00	0.00	580.00
4	4	4	3	193.33	500.00	0.00	0.00	580.00
5	5	1	4	145.00	500.00	0.00	0.00	580.00
6	6	9	2	290.00	500.00	0.00	0.00	580.00
7	7	10	2	30.00	60.00	0.00	0.00	60.00
8	8	1	1	70.00	60.00	0.00	0.00	70.00
9	9	13	5	55.00	275.00	0.00	0.00	275.00
\.


--
-- TOC entry 5256 (class 0 OID 33275)
-- Dependencies: 231
-- Data for Name: productos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.productos (id, nombre, descripcion, precio, stock, stock_minimo, vendedor_id, imagen_url, marca, genero, tamanio_ml, notas_olfativas, activo, fecha_creacion, fecha_actualizacion, proveedor_id, restock, iva_porcentaje) FROM stdin;
2	ODYSSEY	Notas cálidas de sándalo y cedro para un aroma intenso.	30.00	45	10	6	https://cazanovaonline.mx/cdn/shop/files/ANUNNCIO_Amazon_37.jpg?v=1747758258&width=1946	Odyssey	Hombre	100	Sándalo, Cedro, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
7	VERSACE EROS FLAME	Notas cálidas de sándalo y cedro para un aroma intenso.	38.00	35	10	6	https://www.versace.com/dw/image/v2/BGWN_PRD/on/demandware.static/-/Sites-ver-master-catalog/default/dw74626350/original/90_R741010-R100MLS_RNUL_20_Eros~Flame~EDP~100~ml-Accessories-Versace-online-store_0_1.jpg?sw=1200&q=85&strip=true	Versace	Hombre	100	Cítrico, Especiado, Sensual	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
8	JPG LE BEAU LE PARFUM	Notas cálidas de sándalo y cedro para un aroma intenso.	50.00	20	8	6	https://spcdn.shortpixel.ai/spio/ret_img,q_cdnize,to_webp,s_webp/nuestrasfragancias.com/wp-content/uploads/2022/06/Le-Beau-Le-Parfum-125ml-EDP.webp	Jean Paul Gaultier	Hombre	125	Aromático, Fresco, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
10	SAUVAGE DIOR	Notas cálidas de sándalo combinadas con frescura.	30.00	50	12	6	https://www.dior.com/dw/image/v2/BGXS_PRD/on/demandware.static/-/Library-Sites-DiorSharedLibrary/default/dwf80880b6/images/beauty/01-FRAGRANCES/2025/PDP-REVAMP/SAUVAGE/Y0785220/POSTER_DIOR_SAUVAGE_CAPSULE_EDP_VA_916.jpg?sw=800	Dior	Hombre	100	Amaderado, Especiado, Fresco	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
4	9PM	Notas cálidas de sándalo y cedro para un aroma intenso.	45.00	8	8	6	https://m.media-amazon.com/images/I/41ZQdV659VL.jpg	Afnan	Hombre	100	Amaderado, Especiado, Intenso	t	2026-02-04 21:12:51.404965	2026-04-08 09:25:36.692393	2	push	16.00
11	Perfume Amaderado	Notas cálidas de sándalo y cedro para un aroma intenso.	39.00	28	8	6	https://perfumerica.mx/cdn/shop/files/HC3A.png?v=1708969297&width=2048	Casa Propia	Hombre	100	Sándalo, Cedro, Amaderado	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
14	Perfume	Es nuevo	49.00	50	9	6	https://abscents.com.mx/cdn/shop/files/image_431598cc-3fe3-4291-aced-8b9e998ad485-fotor-202403231699.jpg?v=1711231758&width=1080	ACME	Hombre	200	Es bueno	t	2026-03-05 07:21:09.712955	2026-03-05 07:21:09.712955	7	pull	16.00
13	BLACK ORCHID	Una fragancia seductora con notas oscuras de orquídea negra y especias.	55.00	31	7	6	https://abscents.com.mx/cdn/shop/files/image_431598cc-3fe3-4291-aced-8b9e998ad485-fotor-202403231699.jpg?v=1711231758&width=1080	Tom Ford	Mujer	100	Orquídea Negra, Especias, Chocolate	t	2026-03-04 10:00:00	2026-04-16 07:24:42.164228	2	pull	16.00
6	INVICTUS	Notas cálidas de sándalo y cedro para un aroma intenso.	30.00	48	12	6	https://fraganciasfiord.com.mx/wp-content/uploads/2024/06/Decant-o-muestra-del-perfume-Invictus-PARFUM-original-de-Rabanne-en-Fragancias-Fiord.jpg	Paco Rabanne	Hombre	100	Marino, Amaderado, Deportivo	t	2026-02-04 21:12:51.404965	2026-04-15 22:15:02.181296	2	push	16.00
12	Perfume Cítrico	Frescura vibrante con notas de limón y bergamota.	22.00	70	15	6	https://m.media-amazon.com/images/I/71-w3x3BP-L._AC_SX522_.jpg	Casa Propia	Unisex	100	Limón, Bergamota, Cítrico	t	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965	2	push	16.00
15	hola		70.00	40	5	6	https://abscents.com.mx/cdn/shop/files/image_431598cc-3fe3-4291-aced-8b9e998ad485-fotor-202403231699.jpg?v=1711231758&width=1080	yo	Unisex	80		t	2026-03-05 07:30:36.458162	2026-05-19 18:18:13.622563	8	push	16.00
5	9AM	Notas cálidas de sándalo y cedro para un aroma intenso.	28.00	14	10	6	https://beautyfreeshop.com.mx/cdn/shop/files/perfume-9am-dive-unisex-de-afnan-edp-100ml-arome-mexico-1_800x_255077d6-54df-4360-b1ed-c9d48edb8a13.jpg?v=1727982720	Afnan	Unisex	100	Fresco, Acuático, Amaderado	t	2026-02-04 21:12:51.404965	2026-05-19 07:48:21.808842	2	push	16.00
9	COOL WATER	Aroma fresco y acuático con notas marinas.	34.00	48	15	6	https://m.media-amazon.com/images/I/91xkVmTPE3L._UF350,350_QL80_.jpg	Davidoff	Hombre	125	Acuático, Marino, Fresco	t	2026-02-04 21:12:51.404965	2026-04-16 07:41:39.300467	2	push	16.00
3	KHALAF LATTAFA	Notas cálidas de sándalo y cedro para un aroma intenso.	35.00	27	8	6	https://perfumes-arabes.mx/wp-content/uploads/2023/10/Perfume-Lattafa-Khamrah-Perfumes-Arabes-Mexico.jpeg	Lattafa	Hombre	100	Sándalo, Cedro, Especiado	t	2026-02-04 21:12:51.404965	2026-04-15 21:47:17.44406	2	push	16.00
1	NAVIGO	Aromas frescos y delicados con notas de jazmín y rosa.	25.00	50	10	6	https://cdn5.coppel.com/mkp/103020481-1.jpg	Navigo	Unisex	100	Jazmín, Rosa, Notas Florales	t	2026-02-04 21:12:51.404965	2026-05-19 18:50:53.985181	2	push	16.00
16	hola	hola	20.00	20	10	10		hola	Unisex	234	No	t	2026-05-19 19:02:46.804806	2026-05-19 19:09:41.429235	2	push	16.00
\.


--
-- TOC entry 5258 (class 0 OID 33294)
-- Dependencies: 233
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
-- TOC entry 5260 (class 0 OID 33300)
-- Dependencies: 235
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
-- TOC entry 5267 (class 0 OID 33491)
-- Dependencies: 242
-- Data for Name: recursos_empresa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.recursos_empresa (id, nombre, categoria, descripcion, numero_serie, marca, modelo, ubicacion, estado, cantidad, fecha_adquisicion, costo_adquisicion, activo, fecha_creacion, fecha_actualizacion) FROM stdin;
1	Impresora Multifuncional	Impresora	Impresora láser multifuncional para oficina	SN-IMP-001	HP	LaserJet Pro M428	Oficina Principal	disponible	2	2024-01-15	8500.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
2	Computadora Desktop	Computadora	PC de escritorio para administración	SN-PC-001	Dell	OptiPlex 7090	Recepción	en_uso	1	2024-02-20	15000.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
3	Laptop Dell	Computadora	Laptop para trabajo móvil	SN-LAP-001	Dell	Latitude 5520	Almacén	disponible	3	2024-03-10	18000.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
4	Monitor 24 Pulgadas	Monitor	Monitor LED Full HD	SN-MON-001	LG	24MK430H	Oficina Principal	en_uso	5	2024-01-20	3500.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
5	Scanner Documentos	Scanner	Scanner de alta velocidad para documentos	SN-SCAN-001	Epson	WorkForce ES-580W	Oficina Principal	disponible	1	2024-04-05	6000.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
6	Proyector	Equipo Audiovisual	Proyector para presentaciones	SN-PROY-001	BenQ	MH733	Sala de Juntas	disponible	1	2024-05-12	12000.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
7	Router WiFi	Red	Router empresarial de alta velocidad	SN-ROUT-001	Cisco	RV340	Cuarto de Servidores	en_uso	2	2024-02-01	4500.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
8	UPS Respaldo	Energía	Sistema de respaldo de energía	SN-UPS-001	APC	Smart-UPS 1500	Cuarto de Servidores	en_uso	3	2024-01-10	5500.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
9	Silla Ergonómica	Mobiliario	Silla de oficina ergonómica	SN-SILLA-001	Herman Miller	Aeron	Oficina Principal	disponible	10	2024-06-01	8000.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
10	Escritorio Ejecutivo	Mobiliario	Escritorio de madera para oficina	SN-ESC-001	Steelcase	Currency	Oficina Principal	en_uso	5	2024-03-15	6500.00	t	2026-03-25 23:27:47.638969	2026-03-25 23:27:47.638969
\.


--
-- TOC entry 5273 (class 0 OID 33566)
-- Dependencies: 248
-- Data for Name: respuestas_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.respuestas_tickets (id, ticket_id, remitente_type, remitente_id, mensaje, fecha) FROM stdin;
1	1	cliente	9	hola	2026-04-06 07:27:38.314784
2	2	cliente	9	hola	2026-04-06 07:37:30.644043
3	3	cliente	9	HOLA	2026-04-16 07:48:52.825612
4	3	vendedor	6	si	2026-04-16 07:49:23.837701
5	4	cliente	11	no funciona	2026-05-19 07:51:34.469063
6	5	cliente	11	no funciona	2026-05-19 07:56:45.307295
7	5	vendedor	6	hola	2026-05-19 07:59:19.336229
8	6	cliente	11	si	2026-05-19 17:52:04.873455
\.


--
-- TOC entry 5262 (class 0 OID 33311)
-- Dependencies: 237
-- Data for Name: seguimiento_pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.seguimiento_pedidos (id, cliente_id, vendedor_id, pedido_id, estado_paquete, fecha_pedido, ubicacion_actual, descripcion, fecha_actualizacion) FROM stdin;
6	2	6	2	en_proceso	2026-02-08 10:30:00	Almacén principal - Preparando envío	Pedido confirmado, empaquetando productos	2026-02-16 07:26:42.194911
7	5	6	2	entregado	2026-01-15 14:00:00	Entregado en domicilio	Pedido entregado exitosamente - Firmado por cliente	2026-02-16 07:26:42.194911
8	6	6	1	en_reparto	2026-02-10 08:00:00	Repartidor - Zona centro Aguascalientes	En ruta de entrega, llegada estimada 12:00 PM	2026-02-16 07:26:42.194911
5	3	6	1	en_transito	2026-02-05 09:00:00	Centro de distribución - Aguascalientes	Paquete en tránsito hacia destino final	2026-02-16 07:26:42.194911
\.


--
-- TOC entry 5281 (class 0 OID 41834)
-- Dependencies: 256
-- Data for Name: tarjetas_credito; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tarjetas_credito (id, cliente_id, tipo, titular, numero, expiracion, cvv, principal, activa, fecha_creacion, fecha_actualizacion) FROM stdin;
1	9	Visa	Hola	8888888888888888	2001-03-30	123	t	t	2026-04-15 19:19:19.045545	2026-04-15 19:19:19.045545
2	11	Visa	cynnt	5837984892371283	2032-10-01	321	f	t	2026-05-19 17:38:54.036756	2026-05-19 17:38:54.036756
\.


--
-- TOC entry 5271 (class 0 OID 33532)
-- Dependencies: 246
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (num_ticket, vendedor, cliente, asunto, mensaje, pedido, fecha_creacion, fecha_actualizacion, estado, prioridad, categoria, vendedor_respuesta, fecha_respuesta, cliente_respuesta, fecha_cierre, calificacion) FROM stdin;
1	6	9	no	hola	\N	2026-04-06 07:27:38.249531	2026-04-06 07:27:38.249531	abierto	baja	general	\N	\N	\N	\N	\N
2	6	9	hola	hola	\N	2026-04-06 07:37:30.631017	2026-04-06 07:37:30.631017	abierto	media	general	\N	\N	\N	\N	\N
3	6	9	HOLA	HOLA	\N	2026-04-16 07:48:52.817922	2026-04-16 07:49:23.840656	en_proceso	media	general	si	2026-04-16 07:49:23.840656	\N	\N	\N
4	6	11	problema con la factura	no funciona	54	2026-05-19 07:51:34.400564	2026-05-19 07:51:34.400564	abierto	media	general	\N	\N	\N	\N	\N
5	6	11	factura	no funciona	54	2026-05-19 07:56:45.299135	2026-05-19 07:59:19.33906	en_proceso	media	general	hola	2026-05-19 07:59:19.33906	\N	\N	\N
6	6	11	test	si	\N	2026-05-19 17:52:04.866948	2026-05-19 17:52:04.866948	abierto	media	general	\N	\N	\N	\N	\N
\.


--
-- TOC entry 5264 (class 0 OID 33325)
-- Dependencies: 239
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, email, password_hash, rol, telefono, activo, ultimo_login, fecha_creacion, fecha_actualizacion) FROM stdin;
1	Administrador Sistema	admin@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0001	t	2026-02-10 20:18:34.785737	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
2	Juan Carlos Díaz	juan@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0002	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
3	María González	maria@perfumesne2.com	$2b$10$dummyHashForTesting	admin	449-000-0003	t	\N	2026-02-04 21:12:51.404965	2026-02-04 21:12:51.404965
5	Diego Franco	diego@gmail.com	$2b$10$messi1010	admin	496-123-4567	t	2026-03-04 21:43:57.795119	2026-02-10 07:54:48.647442	2026-02-10 07:54:48.647442
4	Fernando Rangel	fernando@perfumesne2.com	$2b$10$fern10	logistica	449-000-0004	t	2026-04-08 08:40:49.3165	2026-02-04 21:12:51.404965	2026-03-12 07:19:22.284127
6	vendedor	vende@gmail.com	$2b$10$vende22	vendedor	593-523-5323	t	2026-05-19 18:11:54.355342	2026-03-03 17:38:33.963407	2026-03-03 17:38:33.963407
8	Staff Logic	logic@perfumes.com	$2b$10$logica	logistica	348-902-8409	t	2026-05-19 18:30:57.128874	2026-03-26 07:04:47.539293	2026-03-26 07:04:47.539293
7	Juan Carlos	carlos@gmail.com	$2b$10$juan44	admin	503-984-9082	t	2026-05-19 18:31:15.933368	2026-03-04 21:20:50.95558	2026-03-04 21:20:50.95558
10	vendedor2	vende2@gmail.com	$2b$10$vende22	vendedor	593-523-5323	t	2026-05-19 18:11:54.355342	2026-03-03 17:38:33.963407	2026-03-03 17:38:33.963407
\.


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 251
-- Name: carrito_items_persistentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carrito_items_persistentes_id_seq', 33, true);


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 249
-- Name: carritos_persistentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carritos_persistentes_id_seq', 7, true);


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 220
-- Name: categorias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categorias_id_seq', 6, true);


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 222
-- Name: clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.clientes_id_seq', 11, true);


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 257
-- Name: configuracion_global_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.configuracion_global_id_seq', 1, true);


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 259
-- Name: cupones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cupones_id_seq', 5, true);


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 224
-- Name: interacciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.interacciones_id_seq', 10, true);


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 253
-- Name: metodos_pago_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metodos_pago_id_seq', 4, true);


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 226
-- Name: metricas_clientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.metricas_clientes_id_seq', 19, true);


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 228
-- Name: movimientos_inventario_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_inventario_id_seq', 81, true);


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 243
-- Name: movimientos_recursos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.movimientos_recursos_id_seq', 14, true);


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 261
-- Name: pedidos_cabecera_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_cabecera_id_seq', 9, true);


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 263
-- Name: pedidos_detalle_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_detalle_id_seq', 9, true);


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 230
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 54, true);


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 232
-- Name: productos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_id_seq', 16, true);


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 234
-- Name: productos_proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.productos_proveedores_id_seq', 12, true);


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 236
-- Name: proveedores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proveedores_id_seq', 8, true);


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 241
-- Name: recursos_empresa_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.recursos_empresa_id_seq', 10, true);


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 247
-- Name: respuestas_tickets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.respuestas_tickets_id_seq', 8, true);


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 238
-- Name: seguimiento_pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seguimiento_pedidos_id_seq', 8, true);


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 255
-- Name: tarjetas_credito_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tarjetas_credito_id_seq', 2, true);


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 245
-- Name: tickets_num_ticket_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tickets_num_ticket_seq', 6, true);


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 240
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 8, true);


--
-- TOC entry 5039 (class 2606 OID 41805)
-- Name: carrito_items_persistentes carrito_items_persistentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items_persistentes
    ADD CONSTRAINT carrito_items_persistentes_pkey PRIMARY KEY (id);


--
-- TOC entry 5035 (class 2606 OID 41788)
-- Name: carritos_persistentes carritos_persistentes_cliente_id_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos_persistentes
    ADD CONSTRAINT carritos_persistentes_cliente_id_session_id_key UNIQUE (cliente_id, session_id);


--
-- TOC entry 5037 (class 2606 OID 41786)
-- Name: carritos_persistentes carritos_persistentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos_persistentes
    ADD CONSTRAINT carritos_persistentes_pkey PRIMARY KEY (id);


--
-- TOC entry 4995 (class 2606 OID 33360)
-- Name: categorias categorias_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_nombre_key UNIQUE (nombre);


--
-- TOC entry 4997 (class 2606 OID 33362)
-- Name: categorias categorias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categorias
    ADD CONSTRAINT categorias_pkey PRIMARY KEY (id);


--
-- TOC entry 4999 (class 2606 OID 33364)
-- Name: clientes clientes_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_correo_key UNIQUE (correo);


--
-- TOC entry 5001 (class 2606 OID 33366)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5051 (class 2606 OID 41879)
-- Name: configuracion_global configuracion_global_clave_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_global
    ADD CONSTRAINT configuracion_global_clave_key UNIQUE (clave);


--
-- TOC entry 5053 (class 2606 OID 41877)
-- Name: configuracion_global configuracion_global_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_global
    ADD CONSTRAINT configuracion_global_pkey PRIMARY KEY (id);


--
-- TOC entry 5055 (class 2606 OID 41921)
-- Name: cupones cupones_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_codigo_key UNIQUE (codigo);


--
-- TOC entry 5057 (class 2606 OID 41919)
-- Name: cupones cupones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cupones
    ADD CONSTRAINT cupones_pkey PRIMARY KEY (id);


--
-- TOC entry 5066 (class 2606 OID 42049)
-- Name: datos_fiscales_clientes datos_fiscales_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datos_fiscales_clientes
    ADD CONSTRAINT datos_fiscales_clientes_pkey PRIMARY KEY (cliente_id);


--
-- TOC entry 5003 (class 2606 OID 33370)
-- Name: interacciones interacciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_pkey PRIMARY KEY (id);


--
-- TOC entry 5041 (class 2606 OID 41832)
-- Name: metodos_pago metodos_pago_nombre_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_nombre_unique UNIQUE (nombre);


--
-- TOC entry 5043 (class 2606 OID 41830)
-- Name: metodos_pago metodos_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metodos_pago
    ADD CONSTRAINT metodos_pago_pkey PRIMARY KEY (id);


--
-- TOC entry 5005 (class 2606 OID 33372)
-- Name: metricas_clientes metricas_clientes_cliente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_key UNIQUE (cliente_id);


--
-- TOC entry 5007 (class 2606 OID 33374)
-- Name: metricas_clientes metricas_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 5009 (class 2606 OID 33376)
-- Name: movimientos_inventario movimientos_inventario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT movimientos_inventario_pkey PRIMARY KEY (id);


--
-- TOC entry 5029 (class 2606 OID 33524)
-- Name: movimientos_recursos movimientos_recursos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_recursos
    ADD CONSTRAINT movimientos_recursos_pkey PRIMARY KEY (id);


--
-- TOC entry 5060 (class 2606 OID 42000)
-- Name: pedidos_cabecera pedidos_cabecera_numero_orden_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_cabecera
    ADD CONSTRAINT pedidos_cabecera_numero_orden_key UNIQUE (numero_orden);


--
-- TOC entry 5062 (class 2606 OID 41998)
-- Name: pedidos_cabecera pedidos_cabecera_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_cabecera
    ADD CONSTRAINT pedidos_cabecera_pkey PRIMARY KEY (id);


--
-- TOC entry 5064 (class 2606 OID 42025)
-- Name: pedidos_detalle pedidos_detalle_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_detalle
    ADD CONSTRAINT pedidos_detalle_pkey PRIMARY KEY (id);


--
-- TOC entry 5011 (class 2606 OID 33380)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5013 (class 2606 OID 33382)
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- TOC entry 5015 (class 2606 OID 33384)
-- Name: productos_proveedores productos_proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 33386)
-- Name: productos_proveedores productos_proveedores_producto_id_proveedor_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_proveedor_id_key UNIQUE (producto_id, proveedor_id);


--
-- TOC entry 5019 (class 2606 OID 33388)
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- TOC entry 5027 (class 2606 OID 33507)
-- Name: recursos_empresa recursos_empresa_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recursos_empresa
    ADD CONSTRAINT recursos_empresa_pkey PRIMARY KEY (id);


--
-- TOC entry 5033 (class 2606 OID 33578)
-- Name: respuestas_tickets respuestas_tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuestas_tickets
    ADD CONSTRAINT respuestas_tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 2606 OID 33390)
-- Name: seguimiento_pedidos seguimiento_pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 5047 (class 2606 OID 41852)
-- Name: tarjetas_credito tarjetas_credito_cliente_id_numero_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjetas_credito
    ADD CONSTRAINT tarjetas_credito_cliente_id_numero_key UNIQUE (cliente_id, numero);


--
-- TOC entry 5049 (class 2606 OID 41850)
-- Name: tarjetas_credito tarjetas_credito_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjetas_credito
    ADD CONSTRAINT tarjetas_credito_pkey PRIMARY KEY (id);


--
-- TOC entry 5031 (class 2606 OID 33544)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (num_ticket);


--
-- TOC entry 5023 (class 2606 OID 33392)
-- Name: usuarios usuarios_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_key UNIQUE (email);


--
-- TOC entry 5025 (class 2606 OID 33394)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 5058 (class 1259 OID 41922)
-- Name: idx_cupones_codigo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cupones_codigo ON public.cupones USING btree (codigo);


--
-- TOC entry 5067 (class 1259 OID 42055)
-- Name: idx_datos_fiscales_clientes_rfc; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_datos_fiscales_clientes_rfc ON public.datos_fiscales_clientes USING btree (rfc);


--
-- TOC entry 5044 (class 1259 OID 41858)
-- Name: idx_tarjetas_cliente_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tarjetas_cliente_id ON public.tarjetas_credito USING btree (cliente_id);


--
-- TOC entry 5045 (class 1259 OID 41924)
-- Name: idx_tarjetas_credito_cliente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tarjetas_credito_cliente ON public.tarjetas_credito USING btree (cliente_id);


--
-- TOC entry 5088 (class 2606 OID 41806)
-- Name: carrito_items_persistentes carrito_items_persistentes_carrito_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items_persistentes
    ADD CONSTRAINT carrito_items_persistentes_carrito_id_fkey FOREIGN KEY (carrito_id) REFERENCES public.carritos_persistentes(id) ON DELETE CASCADE;


--
-- TOC entry 5089 (class 2606 OID 41811)
-- Name: carrito_items_persistentes carrito_items_persistentes_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carrito_items_persistentes
    ADD CONSTRAINT carrito_items_persistentes_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 5087 (class 2606 OID 41789)
-- Name: carritos_persistentes carritos_persistentes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carritos_persistentes
    ADD CONSTRAINT carritos_persistentes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5068 (class 2606 OID 33410)
-- Name: clientes clientes_usuario_registro_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_usuario_registro_id_fkey FOREIGN KEY (usuario_registro_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5091 (class 2606 OID 41880)
-- Name: configuracion_global configuracion_global_actualizado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.configuracion_global
    ADD CONSTRAINT configuracion_global_actualizado_por_fkey FOREIGN KEY (actualizado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 5096 (class 2606 OID 42050)
-- Name: datos_fiscales_clientes datos_fiscales_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.datos_fiscales_clientes
    ADD CONSTRAINT datos_fiscales_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5073 (class 2606 OID 33425)
-- Name: movimientos_inventario fk_movimiento_producto; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_inventario
    ADD CONSTRAINT fk_movimiento_producto FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5082 (class 2606 OID 33525)
-- Name: movimientos_recursos fk_movimiento_recurso; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.movimientos_recursos
    ADD CONSTRAINT fk_movimiento_recurso FOREIGN KEY (recurso_id) REFERENCES public.recursos_empresa(id) ON DELETE CASCADE;


--
-- TOC entry 5069 (class 2606 OID 33430)
-- Name: interacciones interacciones_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5070 (class 2606 OID 33435)
-- Name: interacciones interacciones_producto_mencionado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_producto_mencionado_id_fkey FOREIGN KEY (producto_mencionado_id) REFERENCES public.productos(id);


--
-- TOC entry 5071 (class 2606 OID 33440)
-- Name: interacciones interacciones_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.interacciones
    ADD CONSTRAINT interacciones_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5072 (class 2606 OID 33445)
-- Name: metricas_clientes metricas_clientes_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metricas_clientes
    ADD CONSTRAINT metricas_clientes_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5092 (class 2606 OID 42001)
-- Name: pedidos_cabecera pedidos_cabecera_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_cabecera
    ADD CONSTRAINT pedidos_cabecera_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 5093 (class 2606 OID 42006)
-- Name: pedidos_cabecera pedidos_cabecera_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_cabecera
    ADD CONSTRAINT pedidos_cabecera_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5074 (class 2606 OID 33450)
-- Name: pedidos pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id);


--
-- TOC entry 5094 (class 2606 OID 42026)
-- Name: pedidos_detalle pedidos_detalle_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_detalle
    ADD CONSTRAINT pedidos_detalle_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos_cabecera(id) ON DELETE CASCADE;


--
-- TOC entry 5095 (class 2606 OID 42031)
-- Name: pedidos_detalle pedidos_detalle_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos_detalle
    ADD CONSTRAINT pedidos_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 5075 (class 2606 OID 33455)
-- Name: pedidos pedidos_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- TOC entry 5076 (class 2606 OID 33460)
-- Name: pedidos pedidos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_usuario_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5077 (class 2606 OID 33465)
-- Name: productos_proveedores productos_proveedores_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id) ON DELETE CASCADE;


--
-- TOC entry 5078 (class 2606 OID 33470)
-- Name: productos_proveedores productos_proveedores_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.productos_proveedores
    ADD CONSTRAINT productos_proveedores_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id) ON DELETE CASCADE;


--
-- TOC entry 5086 (class 2606 OID 33579)
-- Name: respuestas_tickets respuestas_tickets_ticket_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuestas_tickets
    ADD CONSTRAINT respuestas_tickets_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.tickets(num_ticket) ON DELETE CASCADE;


--
-- TOC entry 5079 (class 2606 OID 33475)
-- Name: seguimiento_pedidos seguimiento_pedidos_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5080 (class 2606 OID 33480)
-- Name: seguimiento_pedidos seguimiento_pedidos_pedido_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE CASCADE;


--
-- TOC entry 5081 (class 2606 OID 33485)
-- Name: seguimiento_pedidos seguimiento_pedidos_vendedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.seguimiento_pedidos
    ADD CONSTRAINT seguimiento_pedidos_vendedor_id_fkey FOREIGN KEY (vendedor_id) REFERENCES public.usuarios(id);


--
-- TOC entry 5090 (class 2606 OID 41853)
-- Name: tarjetas_credito tarjetas_credito_cliente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tarjetas_credito
    ADD CONSTRAINT tarjetas_credito_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id) ON DELETE CASCADE;


--
-- TOC entry 5083 (class 2606 OID 33550)
-- Name: tickets tickets_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_cliente_fkey FOREIGN KEY (cliente) REFERENCES public.clientes(id);


--
-- TOC entry 5084 (class 2606 OID 33555)
-- Name: tickets tickets_pedido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pedido_fkey FOREIGN KEY (pedido) REFERENCES public.pedidos(id);


--
-- TOC entry 5085 (class 2606 OID 33545)
-- Name: tickets tickets_vendedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_vendedor_fkey FOREIGN KEY (vendedor) REFERENCES public.usuarios(id);


-- Completed on 2026-05-19 19:28:31

--
-- PostgreSQL database dump complete
--

\unrestrict 1fTvWayM2ZV8CL3ZtlZBpVRgQrUe29YeHJRsjc2Upw6pgdJiuivQljPGkE9B1tF

