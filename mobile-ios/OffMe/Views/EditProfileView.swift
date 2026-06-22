import PhotosUI
import SwiftUI

struct EditProfileView: View {
    let user: User
    let onSaved: (User) -> Void

    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var auth: AuthStore

    @State private var displayName: String
    @State private var bio: String
    @State private var location: String
    @State private var websiteUrl: String
    @State private var avatarUrl: String
    @State private var bannerUrl: String
    @State private var avatarPreview: UIImage?
    @State private var bannerPreview: UIImage?
    @State private var avatarPickerItem: PhotosPickerItem?
    @State private var bannerPickerItem: PhotosPickerItem?
    @State private var cropImage: UIImage?
    @State private var cropMode: ImageCropMode?
    @State private var uploadingAvatar = false
    @State private var uploadingBanner = false
    @State private var saving = false
    @State private var error: String?

    init(user: User, onSaved: @escaping (User) -> Void) {
        self.user = user
        self.onSaved = onSaved
        _displayName = State(initialValue: user.displayName)
        _bio = State(initialValue: user.bio ?? "")
        _location = State(initialValue: user.location ?? "")
        _websiteUrl = State(initialValue: user.websiteUrl ?? "")
        _avatarUrl = State(initialValue: user.avatarUrl ?? "")
        _bannerUrl = State(initialValue: user.bannerUrl ?? "")
    }

    var body: some View {
        NavigationStack {
            Form {
                if let error {
                    Text(error)
                        .foregroundStyle(.red)
                        .font(.caption)
                }

                Section {
                    bannerSection
                }

                Section {
                    avatarSection
                }

                Section("Nome") {
                    TextField("Nome de exibição", text: $displayName)
                }

                Section("Bio") {
                    TextField("Bio", text: $bio, axis: .vertical)
                        .lineLimit(3...5)
                    Text("\(160 - bio.count) restantes")
                        .font(.caption)
                        .foregroundStyle(OffMeTheme.muted)
                }

                Section("Localização") {
                    TextField("Cidade, país", text: $location)
                }

                Section("Site") {
                    TextField("https://", text: $websiteUrl)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.URL)
                        .autocorrectionDisabled()
                }
            }
            .scrollContentBackground(.hidden)
            .background(OffMeTheme.bg)
            .navigationTitle("Editar perfil")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(saving ? "..." : "Salvar") {
                        Task { await save() }
                    }
                    .disabled(saving || uploadingAvatar || uploadingBanner)
                }
            }
            .onChange(of: avatarPickerItem) { newItem in
                guard let newItem else { return }
                Task { await handlePick(newItem, mode: .avatar) }
            }
            .onChange(of: bannerPickerItem) { newItem in
                guard let newItem else { return }
                Task { await handlePick(newItem, mode: .banner) }
            }
            .fullScreenCover(item: $cropMode) { mode in
                if let cropImage {
                    ImageCropView(
                        image: cropImage,
                        mode: mode,
                        onCancel: {
                            self.cropMode = nil
                            self.cropImage = nil
                        },
                        onCrop: { cropped in
                            self.cropMode = nil
                            self.cropImage = nil
                            Task { await uploadCropped(cropped, mode: mode) }
                        }
                    )
                }
            }
        }
    }

    private var bannerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Banner")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(OffMeTheme.muted)

            ZStack(alignment: .center) {
                Group {
                    if let bannerPreview {
                        Image(uiImage: bannerPreview)
                            .resizable()
                            .scaledToFill()
                    } else if let urlString = bannerUrl.isEmpty ? nil : bannerUrl,
                              let url = URL(string: urlString) {
                        AsyncImage(url: url) { phase in
                            if case .success(let image) = phase {
                                image.resizable().scaledToFill()
                            } else {
                                bannerPlaceholder
                            }
                        }
                    } else {
                        bannerPlaceholder
                    }
                }
                .frame(height: 96)
                .frame(maxWidth: .infinity)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                PhotosPicker(selection: $bannerPickerItem, matching: .images) {
                    Text(uploadingBanner ? "Enviando..." : "Alterar banner")
                        .font(.caption.weight(.bold))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(.black.opacity(0.55), in: Capsule())
                        .foregroundStyle(.white)
                }
                .disabled(uploadingBanner)
            }
        }
    }

    private var avatarSection: some View {
        HStack(spacing: 16) {
            Group {
                if let avatarPreview {
                    Image(uiImage: avatarPreview)
                        .resizable()
                        .scaledToFill()
                } else if let urlString = avatarUrl.isEmpty ? nil : avatarUrl,
                          let url = URL(string: urlString) {
                    AsyncImage(url: url) { phase in
                        if case .success(let image) = phase {
                            image.resizable().scaledToFill()
                        } else {
                            avatarPlaceholder
                        }
                    }
                } else {
                    avatarPlaceholder
                }
            }
            .frame(width: 72, height: 72)
            .clipShape(Circle())
            .overlay(Circle().stroke(OffMeTheme.border, lineWidth: 1))

            PhotosPicker(selection: $avatarPickerItem, matching: .images) {
                Text(uploadingAvatar ? "Enviando..." : "Alterar foto")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(OffMeTheme.accent)
            }
            .disabled(uploadingAvatar)
        }
    }

    private var avatarPlaceholder: some View {
        Circle()
            .fill(OffMeTheme.surface)
            .overlay {
                Image(systemName: "camera.fill")
                    .foregroundStyle(OffMeTheme.muted)
            }
    }

    private var bannerPlaceholder: some View {
        RoundedRectangle(cornerRadius: 12, style: .continuous)
            .fill(OffMeTheme.surface)
            .overlay {
                Image(systemName: "photo")
                    .foregroundStyle(OffMeTheme.muted)
            }
    }

    private func handlePick(_ item: PhotosPickerItem, mode: ImageCropMode) async {
        defer {
            if mode == .avatar { avatarPickerItem = nil }
            else { bannerPickerItem = nil }
        }

        guard let data = try? await item.loadTransferable(type: Data.self),
              let image = UIImage(data: data) else {
            error = "Não foi possível ler a imagem"
            return
        }

        cropImage = image
        cropMode = mode
    }

    private func uploadCropped(_ image: UIImage, mode: ImageCropMode) async {
        guard let token = auth.accessToken,
              let data = image.jpegData(compressionQuality: 0.9) else { return }

        if mode == .avatar { uploadingAvatar = true }
        else { uploadingBanner = true }
        error = nil
        defer {
            uploadingAvatar = false
            uploadingBanner = false
        }

        do {
            let filename = mode == .avatar ? "avatar.jpg" : "banner.jpg"
            let uploaded = try await APIClient.shared.uploadImage(
                data: data,
                mimeType: "image/jpeg",
                filename: filename,
                token: token
            )
            if mode == .avatar {
                avatarPreview = image
                avatarUrl = uploaded.url
            } else {
                bannerPreview = image
                bannerUrl = uploaded.url
            }
        } catch {
            self.error = error.localizedDescription
        }
    }

    private func save() async {
        guard let token = auth.accessToken else { return }
        saving = true
        error = nil
        defer { saving = false }

        do {
            let trimmedAvatar = avatarUrl.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedBanner = bannerUrl.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedLocation = location.trimmingCharacters(in: .whitespacesAndNewlines)
            let trimmedWebsite = websiteUrl.trimmingCharacters(in: .whitespacesAndNewlines)
            let updated = try await APIClient.shared.updateProfile(
                token: token,
                displayName: displayName.trimmingCharacters(in: .whitespacesAndNewlines),
                bio: bio.trimmingCharacters(in: .whitespacesAndNewlines),
                avatarUrl: trimmedAvatar.isEmpty ? nil : trimmedAvatar,
                bannerUrl: trimmedBanner.isEmpty ? nil : trimmedBanner,
                location: trimmedLocation.isEmpty ? nil : trimmedLocation,
                websiteUrl: trimmedWebsite.isEmpty ? nil : trimmedWebsite
            )
            auth.updateUser(updated)
            onSaved(updated)
            dismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}

extension ImageCropMode: Identifiable {
    var id: String { title }
}