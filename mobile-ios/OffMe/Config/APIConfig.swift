import Foundation

enum APIConfig {
    /// Altere para o IP do seu Mac na rede local (Simulador não alcança localhost do host).
    /// Rode: ipconfig getifaddr en0
    static let baseURL = "http://192.168.0.100:3000/api/v1"
}