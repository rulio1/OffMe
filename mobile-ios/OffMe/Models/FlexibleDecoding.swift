import Foundation

enum FlexibleDecoding {
    static func int<Key: CodingKey>(from container: KeyedDecodingContainer<Key>, forKey key: Key) throws -> Int {
        if let value = try? container.decode(Int.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(String.self, forKey: key), let parsed = Int(value) {
            return parsed
        }
        if let value = try? container.decode(Double.self, forKey: key) {
            return Int(value)
        }
        throw DecodingError.dataCorruptedError(forKey: key, in: container, debugDescription: "Invalid integer")
    }

    static func intIfPresent<Key: CodingKey>(
        from container: KeyedDecodingContainer<Key>,
        forKey key: Key
    ) -> Int? {
        if let value = try? container.decode(Int.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(String.self, forKey: key), let parsed = Int(value) {
            return parsed
        }
        if let value = try? container.decode(Double.self, forKey: key) {
            return Int(value)
        }
        return nil
    }

    static func int64<Key: CodingKey>(from container: KeyedDecodingContainer<Key>, forKey key: Key) throws -> Int64 {
        if let value = try? container.decode(Int64.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(Int.self, forKey: key) {
            return Int64(value)
        }
        if let value = try? container.decode(Double.self, forKey: key) {
            return Int64(value)
        }
        if let value = try? container.decode(String.self, forKey: key), let parsed = Int64(value) {
            return parsed
        }
        throw DecodingError.dataCorruptedError(forKey: key, in: container, debugDescription: "Invalid integer64")
    }

    static func boolIfPresent<Key: CodingKey>(
        from container: KeyedDecodingContainer<Key>,
        forKey key: Key
    ) -> Bool? {
        if let value = try? container.decode(Bool.self, forKey: key) {
            return value
        }
        if let value = try? container.decode(Int.self, forKey: key) {
            return value != 0
        }
        if let value = try? container.decode(String.self, forKey: key) {
            return value == "true" || value == "1"
        }
        return nil
    }

    static func stringIfPresent<Key: CodingKey>(
        from container: KeyedDecodingContainer<Key>,
        forKey key: Key
    ) -> String? {
        if let value = try? container.decode(String.self, forKey: key) {
            let trimmed = value.trimmingCharacters(in: CharacterSet.whitespacesAndNewlines)
            return trimmed.isEmpty ? nil : trimmed
        }
        if container.contains(key), (try? container.decodeNil(forKey: key)) == true {
            return nil
        }
        return nil
    }
}