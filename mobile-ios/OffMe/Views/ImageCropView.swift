import SwiftUI

enum ImageCropMode {
    case avatar
    case banner

    var aspect: CGFloat {
        switch self {
        case .avatar: return 1
        case .banner: return 3
        }
    }

    var isRound: Bool { self == .avatar }

    var title: String {
        switch self {
        case .avatar: return "Cortar avatar"
        case .banner: return "Cortar banner"
        }
    }
}

struct ImageCropView: View {
    let image: UIImage
    let mode: ImageCropMode
    let onCancel: () -> Void
    let onCrop: (UIImage) -> Void

    @State private var scale: CGFloat = 1
    @State private var lastScale: CGFloat = 1
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        NavigationStack {
            GeometryReader { geo in
                let cropSize = cropFrameSize(in: geo.size)

                ZStack {
                    Color.black.ignoresSafeArea()

                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .scaleEffect(scale)
                        .offset(offset)
                        .frame(width: geo.size.width, height: geo.size.height)
                        .clipped()
                        .gesture(dragGesture)
                        .simultaneousGesture(magnificationGesture)

                    CropMaskOverlay(cropSize: cropSize, isRound: mode.isRound)
                        .allowsHitTesting(false)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
            .navigationTitle(mode.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancelar", action: onCancel)
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Aplicar") {
                        if let cropped = renderCrop() {
                            onCrop(cropped)
                        }
                    }
                    .fontWeight(.bold)
                }
            }
        }
    }

    private var dragGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                offset = CGSize(
                    width: lastOffset.width + value.translation.width,
                    height: lastOffset.height + value.translation.height
                )
            }
            .onEnded { _ in
                lastOffset = offset
            }
    }

    private var magnificationGesture: some Gesture {
        MagnificationGesture()
            .onChanged { value in
                scale = min(max(lastScale * value, 1), 4)
            }
            .onEnded { _ in
                lastScale = scale
            }
    }

    private func cropFrameSize(in container: CGSize) -> CGSize {
        let width = container.width - 32
        switch mode {
        case .avatar:
            let side = min(width, container.height * 0.55)
            return CGSize(width: side, height: side)
        case .banner:
            let height = min(width / mode.aspect, container.height * 0.35)
            return CGSize(width: height * mode.aspect, height: height)
        }
    }

    private func renderCrop() -> UIImage? {
        let maxWidth: CGFloat = mode == .avatar ? 512 : 1500
        let outputSize: CGSize
        switch mode {
        case .avatar:
            outputSize = CGSize(width: maxWidth, height: maxWidth)
        case .banner:
            outputSize = CGSize(width: maxWidth, height: maxWidth / mode.aspect)
        }

        let renderer = UIGraphicsImageRenderer(size: outputSize)
        return renderer.image { ctx in
            let cg = ctx.cgContext
            if mode.isRound {
                let rect = CGRect(origin: .zero, size: outputSize)
                cg.addEllipse(in: rect)
                cg.clip()
            }

            let imageSize = image.size
            let baseScale = max(outputSize.width / imageSize.width, outputSize.height / imageSize.height)
            let totalScale = baseScale * scale
            let drawWidth = imageSize.width * totalScale
            let drawHeight = imageSize.height * totalScale
            let normalizedOffset = CGSize(
                width: offset.width * (outputSize.width / max(outputSize.width, 1)),
                height: offset.height * (outputSize.height / max(outputSize.height, 1))
            )
            let origin = CGPoint(
                x: (outputSize.width - drawWidth) / 2 + normalizedOffset.width,
                y: (outputSize.height - drawHeight) / 2 + normalizedOffset.height
            )
            image.draw(in: CGRect(x: origin.x, y: origin.y, width: drawWidth, height: drawHeight))
        }
    }
}

private struct CropMaskOverlay: View {
    let cropSize: CGSize
    let isRound: Bool

    var body: some View {
        Canvas { context, size in
            var mask = Path(CGRect(origin: .zero, size: size))
            let cropRect = CGRect(
                x: (size.width - cropSize.width) / 2,
                y: (size.height - cropSize.height) / 2,
                width: cropSize.width,
                height: cropSize.height
            )
            if isRound {
                mask.addEllipse(in: cropRect)
            } else {
                mask.addRoundedRect(in: cropRect, cornerSize: CGSize(width: 12, height: 12))
            }
            context.fill(mask, with: .color(.black.opacity(0.62)), style: FillStyle(eoFill: true))

            if isRound {
                context.stroke(Path(ellipseIn: cropRect), with: .color(.white.opacity(0.9)), lineWidth: 2)
            } else {
                context.stroke(
                    Path(roundedRect: cropRect, cornerRadius: 12),
                    with: .color(.white.opacity(0.9)),
                    lineWidth: 2
                )
            }
        }
    }
}