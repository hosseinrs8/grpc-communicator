export interface GRPCIdentity {
  serverHost: string;
  clientHost: string;
  localPort: number;
  foreignPort: number;
  protoPath: string;
}
