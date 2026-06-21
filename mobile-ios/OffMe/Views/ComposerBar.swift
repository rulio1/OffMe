import PhotosUI
import SwiftUI

struct ComposerBar: View {
    var placeholder: String = "O que está acontecendo?"
    let onPost: (String, [String]) async throws -> Void

    @EnvironmentObject private var auth: AuthStore

    @State private var text = ""
    @State private var focused = false
    @State private var isPosting = false
    @State private var isUploading = false
    @State private var error: String?
    @State private var pickerItem: PhotosPickerItem?
    @State private var pendingMediaIds: [String] = []
    @State private var previewImages: [UIImage] = []

    private let maxLength = 280
    private let maxImages = 4

    private var expanded: Bool {
        focused || !text.isEmpty || !previewImages.isEmpty
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if let error {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.bottom, 8)
            }

            HStack(alignment: .top, spacing: 12) {
                UserAvatarView(url: auth.session?.user.avatarUrl, size: 40)

                VStack(alignment: .leading, spacing: 8) {
                    TextField(placeholder, text: $text, axis: .vertical)
                        .lineLimit(expanded ? 2...6 : 1...3)
                        .font(.system(size: 20))
                        .foregroundStyle(OffMeTheme.text)
                        .onTapGesture { focused = true }

                    if !previewImages.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 4) {
                                ForEach(previewImages.indices, id: \.self) { index in
                                    Image(uiImage: previewImages[index])
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 120, height: 120)
                                        .clipShape(RoundedRectangle(cornerRadius: 16))
                                }
                            }
                        }
                    }

                    if expanded {
                        Divider().overlay(OffMeTheme.border)

                        HStack {
                            PhotosPicker(
                                selection: $pickerItem,
                                matching: .images,
                                photoLibrary: .shared()
                            ) {
                                Image(systemName: "photo")
                                    .font(.system(size: 20))
                                    .foregroundStyle(OffMeTheme.accent)
                                    .frame(width: 36, height: 36)
                            }
                            .disabled(isUploading || pendingMediaIds.count >= maxImages)

                            if isUploading {
                                Text("Enviando...")
                                    .font(.caption)
                                    .foregroundStyle(OffMeTheme.muted)
                            }

                            Spacer()

                            Text("\(maxLength - text.count)")
                                .font(.caption)
                                .foregroundStyle(text.count > maxLength ? .red : OffMeTheme.muted)

                            Button {
                                Task { await submit() }
                            } label: {
                                Text(isPosting ? "Publicando..." : "Publicar")
                                    .font(.subheadline.weight(.bold))
                                    .foregroundStyle(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        Capsule()
                                            .fill(canPost ? OffMeTheme.accent : OffMeTheme.muted.opacity(0.5))
                                    )
                            }
                            .disabled(!canPost || isPosting || isUploading)
                        }
                        .padding(.top, 8)
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
        }
        .background(OffMeTheme.bg)
        .overlay(alignment: .bottom) {
            Rectangle()
                .fill(OffMeTheme.border)
                .frame(height: 0.5)
        }
        .onChange(of: pickerItem) { newItem in
            guard let newItem else { return }
            Task { await handleImagePick(newItem) }
        }
    }

    private var canPost: Bool {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        return (!trimmed.isEmpty || !pendingMediaIds.isEmpty) && text.count <= maxLength
    }

    private func handleImagePick(_ item: PhotosPickerItem) async {
        guard pendingMediaIds.count < maxImages, let token = auth.accessToken else { return }
        isUploading = true
        error = nil
        focused = true
        defer {
            isUploading = false
            pickerItem = nil
        }

        do {
            guard let data = try await item.loadTransferable(type: Data.self) else {
                error = "Não foi possível ler a imagem"
                return
            }
            if let image = UIImage(data: data) {
                previewImages.append(image)
            }
            let uploaded = try await APIClient.shared.uploadImage(
                data: data,
                mimeType: "image/jpeg",
                filename: "photo.jpg",
                token: token
            )
            pendingMediaIds.append(uploaded.id)
        } catch {
            self.error = error.localizedDescription
            if !previewImages.isEmpty { previewImages.removeLast() }
        }
    }

    private func submit() async {
        guard canPost else { return }
        isPosting = true
        error = nil
        defer { isPosting = false }

        do {
            try await onPost(
                text.trimmingCharacters(in: .whitespacesAndNewlines),
                pendingMediaIds
            )
            text = ""
            focused = false
            pendingMediaIds = []
            previewImages = []
        } catch {
            self.error = error.localizedDescription
        }
    }
}