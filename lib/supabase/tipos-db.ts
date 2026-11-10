
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "autos": {
                  Row: {
                    "anio": number,"color": string | null,"combustible": string | null,"comprador_id": string | null,"created_at": string,"estado": string,"fecha_compra": string | null,"fecha_venta": string | null,"id": string,"kilometraje": number | null,"marca": string,"modelo": string,"notas": string | null,"numero_motor": string | null,"numero_serie": string | null,"placa": string,"precio_compra": number | null,"precio_venta_final": number | null,"precio_venta_objetivo": number | null,"transmision": string | null,"updated_at": string,"user_id": string,"vendedor_id": string | null,"version": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "anio": number,"color"?: string | null,"combustible"?: string | null,"comprador_id"?: string | null,"created_at"?: string,"estado"?: string,"fecha_compra"?: string | null,"fecha_venta"?: string | null,"id"?: string,"kilometraje"?: number | null,"marca": string,"modelo": string,"notas"?: string | null,"numero_motor"?: string | null,"numero_serie"?: string | null,"placa": string,"precio_compra"?: number | null,"precio_venta_final"?: number | null,"precio_venta_objetivo"?: number | null,"transmision"?: string | null,"updated_at"?: string,"user_id"?: string,"vendedor_id"?: string | null,"version"?: string | null
                  }
                  Update: {
                    "anio"?: number,"color"?: string | null,"combustible"?: string | null,"comprador_id"?: string | null,"created_at"?: string,"estado"?: string,"fecha_compra"?: string | null,"fecha_venta"?: string | null,"id"?: string,"kilometraje"?: number | null,"marca"?: string,"modelo"?: string,"notas"?: string | null,"numero_motor"?: string | null,"numero_serie"?: string | null,"placa"?: string,"precio_compra"?: number | null,"precio_venta_final"?: number | null,"precio_venta_objetivo"?: number | null,"transmision"?: string | null,"updated_at"?: string,"user_id"?: string,"vendedor_id"?: string | null,"version"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "comprador_mismo_usuario"
      columns: ["comprador_id","user_id"]
isOneToOne: false
      referencedRelation: "contactos"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "vendedor_mismo_usuario"
      columns: ["vendedor_id","user_id"]
isOneToOne: false
      referencedRelation: "contactos"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"contactos": {
                  Row: {
                    "created_at": string,"direccion": string | null,"dni": string | null,"id": string,"nombre": string,"telefono": string | null,"tipo": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"direccion"?: string | null,"dni"?: string | null,"id"?: string,"nombre": string,"telefono"?: string | null,"tipo"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"direccion"?: string | null,"dni"?: string | null,"id"?: string,"nombre"?: string,"telefono"?: string | null,"tipo"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"documentos": {
                  Row: {
                    "archivo_path": string | null,"auto_id": string,"created_at": string,"descripcion": string | null,"fecha_vencimiento": string | null,"id": string,"tipo": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "archivo_path"?: string | null,"auto_id": string,"created_at"?: string,"descripcion"?: string | null,"fecha_vencimiento"?: string | null,"id"?: string,"tipo": string,"user_id"?: string
                  }
                  Update: {
                    "archivo_path"?: string | null,"auto_id"?: string,"created_at"?: string,"descripcion"?: string | null,"fecha_vencimiento"?: string | null,"id"?: string,"tipo"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "documentos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "documentos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos_resumen"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"eventos_pago": {
                  Row: {
                    "id": string,"payload": NonNullable<Json>,"proveedor": string,"recibido_at": string,"tipo": string
                  }
                  ComputedFields: never
                  Insert: {
                    "id": string,"payload": NonNullable<Json>,"proveedor": string,"recibido_at"?: string,"tipo": string
                  }
                  Update: {
                    "id"?: string,"payload"?: NonNullable<Json>,"proveedor"?: string,"recibido_at"?: string,"tipo"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fotos": {
                  Row: {
                    "auto_id": string,"created_at": string,"id": string,"orden": number,"path": string,"path_miniatura": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auto_id": string,"created_at"?: string,"id"?: string,"orden"?: number,"path": string,"path_miniatura"?: string | null,"user_id"?: string
                  }
                  Update: {
                    "auto_id"?: string,"created_at"?: string,"id"?: string,"orden"?: number,"path"?: string,"path_miniatura"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "fotos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "fotos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos_resumen"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"gastos": {
                  Row: {
                    "auto_id": string,"categoria": string,"created_at": string,"descripcion": string | null,"fecha": string,"id": string,"monto": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "auto_id": string,"categoria": string,"created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"id"?: string,"monto": number,"user_id"?: string
                  }
                  Update: {
                    "auto_id"?: string,"categoria"?: string,"created_at"?: string,"descripcion"?: string | null,"fecha"?: string,"id"?: string,"monto"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gastos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "gastos_auto_id_user_id_fkey"
      columns: ["auto_id","user_id"]
isOneToOne: false
      referencedRelation: "autos_resumen"
      referencedColumns: ["id","user_id"]
    }
                  ]
                },"pagos": {
                  Row: {
                    "created_at": string,"estado": string,"fecha": string,"id": string,"moneda": string,"monto": number,"plan": string | null,"proveedor": string,"proveedor_pago_id": string,"proveedor_suscripcion_id": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"estado": string,"fecha"?: string,"id"?: string,"moneda": string,"monto": number,"plan"?: string | null,"proveedor": string,"proveedor_pago_id": string,"proveedor_suscripcion_id"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"estado"?: string,"fecha"?: string,"id"?: string,"moneda"?: string,"monto"?: number,"plan"?: string | null,"proveedor"?: string,"proveedor_pago_id"?: string,"proveedor_suscripcion_id"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"perfiles": {
                  Row: {
                    "ciudad": string,"created_at": string,"direccion": string | null,"dni": string | null,"id": string,"negocio": string | null,"nombre": string | null,"telefono": string | null,"umbral_amarillo": number,"umbral_verde": number,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "ciudad"?: string,"created_at"?: string,"direccion"?: string | null,"dni"?: string | null,"id": string,"negocio"?: string | null,"nombre"?: string | null,"telefono"?: string | null,"umbral_amarillo"?: number,"umbral_verde"?: number,"updated_at"?: string
                  }
                  Update: {
                    "ciudad"?: string,"created_at"?: string,"direccion"?: string | null,"dni"?: string | null,"id"?: string,"negocio"?: string | null,"nombre"?: string | null,"telefono"?: string | null,"umbral_amarillo"?: number,"umbral_verde"?: number,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"plantillas": {
                  Row: {
                    "contenido": string,"created_at": string,"id": string,"tipo": string,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contenido": string,"created_at"?: string,"id"?: string,"tipo": string,"updated_at"?: string,"user_id"?: string
                  }
                  Update: {
                    "contenido"?: string,"created_at"?: string,"id"?: string,"tipo"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"suscripciones": {
                  Row: {
                    "created_at": string,"estado": string,"periodo_hasta": string | null,"plan": string,"proveedor": string | null,"proveedor_suscripcion_id": string | null,"prueba_hasta": string | null,"updated_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"estado"?: string,"periodo_hasta"?: string | null,"plan"?: string,"proveedor"?: string | null,"proveedor_suscripcion_id"?: string | null,"prueba_hasta"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"estado"?: string,"periodo_hasta"?: string | null,"plan"?: string,"proveedor"?: string | null,"proveedor_suscripcion_id"?: string | null,"prueba_hasta"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "autos_resumen": {
                  Row: {
                    "anio": number,"color": string | null,"combustible": string | null,"comprador_id": string | null,"created_at": string,"estado": string,"fecha_compra": string | null,"fecha_venta": string | null,"id": string,"kilometraje": number | null,"marca": string,"modelo": string,"notas": string | null,"numero_motor": string | null,"numero_serie": string | null,"placa": string,"precio_compra": number | null,"precio_venta_final": number | null,"precio_venta_objetivo": number | null,"total_gastos": number | null,"transmision": string | null,"updated_at": string,"user_id": string,"vendedor_id": string | null,"version": string | null
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "comprador_mismo_usuario"
      columns: ["comprador_id","user_id"]
isOneToOne: false
      referencedRelation: "contactos"
      referencedColumns: ["id","user_id"]
    },{
      foreignKeyName: "vendedor_mismo_usuario"
      columns: ["vendedor_id","user_id"]
isOneToOne: false
      referencedRelation: "contactos"
      referencedColumns: ["id","user_id"]
    }
                  ]
                }
          }
          Functions: {
            "hoy_lima":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"plan_efectivo":
{ Args: { "uid": string }; Returns: string
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
