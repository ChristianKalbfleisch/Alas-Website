// Writes a mask of whatever stands in the foreground of a picture (white = object),
// using the Mac's own Vision framework.   swift lift.swift PICTURE OUT.png
import CoreImage
import Foundation
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("usage: lift PICTURE OUT.png")
  exit(1)
}
let source = URL(fileURLWithPath: args[1])
let target = URL(fileURLWithPath: args[2])
guard let image = CIImage(contentsOf: source) else {
  print("cannot read \(source.path)")
  exit(1)
}
let handler = VNImageRequestHandler(ciImage: image, options: [:])
let request = VNGenerateForegroundInstanceMaskRequest()
do {
  try handler.perform([request])
  guard let result = request.results?.first else {
    print("nothing found in the foreground")
    exit(2)
  }
  let buffer = try result.generateScaledMaskForImage(
    forInstances: result.allInstances, from: handler)
  let grey = CGColorSpace(name: CGColorSpace.linearGray)!
  try CIContext().writePNGRepresentation(
    of: CIImage(cvPixelBuffer: buffer), to: target, format: .L8, colorSpace: grey)
} catch {
  print("error: \(error)")
  exit(3)
}
